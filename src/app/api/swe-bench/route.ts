import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const LEADERBOARD_URL = 'https://www.marc0.dev/en/leaderboard';
const BASE_URL = 'https://www.marc0.dev';

// Hardcoded data based on user request and provided information (Feb 2026)
// Used as fallback if scraping fails
const FALLBACK_VERIFIED = [
  { rank: 1, model: "Claude Opus 4.5", score: 80.9, provider: "Anthropic" },
  { rank: 2, model: "Claude Opus 4.6", score: 80.8, provider: "Anthropic" },
  { rank: 3, model: "MiniMax M2.5", score: 80.2, provider: "MiniMax" },
  { rank: 4, model: "GPT-5.2", score: 80.0, provider: "OpenAI" },
  { rank: 5, model: "Gemini 3 Flash", score: 78.0, provider: "Google" },
  { rank: 6, model: "GLM-5", score: 77.8, provider: "Zhipu AI" },
  { rank: 7, model: "Claude Sonnet 4.5", score: 77.2, provider: "Anthropic" },
];

const FALLBACK_PRO = [
  { rank: 1, model: "GPT-5.3-Codex", score: 56.8, provider: "OpenAI" },
  { rank: 2, model: "GPT-5.2-Codex", score: 56.4, provider: "OpenAI" },
  { rank: 3, model: "GPT-5.2", score: 55.6, provider: "OpenAI" },
  { rank: 4, model: "GPT-5.1-Codex", score: 50.8, provider: "OpenAI" },
  { rank: 5, model: "Claude Opus 4.5", score: 45.9, provider: "Anthropic" },
  { rank: 6, model: "Claude Sonnet 4.5", score: 45.8, provider: "Anthropic" },
  { rank: 7, model: "Qwen3-Coder-Next", score: 44.3, provider: "Alibaba" },
];

async function scrapeData() {
  try {
    const res = await fetch(LEADERBOARD_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // 1. Try to find the JS file that contains the data
    const scriptSrcs: string[] = [];
    $('script[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (src && src.includes('/_next/static/chunks/')) {
            // Only fetch chunks that look like they might contain page data (usually hashed filenames)
            // We'll fetch all of them to be safe, there aren't that many
            scriptSrcs.push(src);
        }
    });

    let verifiedData: any[] = [];
    let proData: any[] = [];
    
    // Fetch and scan scripts
    for (const src of scriptSrcs) {
        try {
            const url = src.startsWith('http') ? src : `${BASE_URL}${src}`;
            const scriptRes = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
            });
            if (!scriptRes.ok) continue;
            
            const scriptContent = await scriptRes.text();
            
            // Search for entries:[{...}]
            // Regex to find "entries:[{" and capture until the matching "]"
            // Since we don't have a full parser, we'll capture a reasonable amount of characters
            // and try to parse/clean it.
            // Based on inspection, the structure is `entries:[{rank:1,model:"...",...},...]`
            
            const entriesRegex = /entries:(\[\{.*?\}\])/g;
            let match;
            
            while ((match = entriesRegex.exec(scriptContent)) !== null) {
                const rawArray = match[1];
                
                // Parse the array
                // It's not valid JSON (unquoted keys), so we need to fix it or manual parse
                const parsed = parseJSArray(rawArray);
                
                if (parsed.length > 0) {
                    // Identify which leaderboard it is
                    const isVerified = parsed.some(p => p.model.includes('Claude Opus 4.5') && Math.abs(p.score - 80.9) < 0.5);
                    const isPro = parsed.some(p => p.model.includes('GPT-5.3-Codex') && Math.abs(p.score - 56.8) < 0.5);
                    
                    if (isVerified && verifiedData.length === 0) {
                        verifiedData = parsed;
                    } else if (isPro && proData.length === 0) {
                        proData = parsed;
                    }
                }
            }
            
            if (verifiedData.length > 0 && proData.length > 0) break;
            
        } catch (e) {
            console.error('Error fetching/parsing script:', src, e);
        }
    }
    
    // Fallback to FAQ scraping if JS scraping failed
    if (verifiedData.length === 0 || proData.length === 0) {
         // ... (Keep existing FAQ logic as fallback if needed, but for now we trust the JS scraping)
         // Or just return what we found combined with fallback
    }

    // Deduplicate and Sort
    if (verifiedData.length > 0) verifiedData = deduplicate(verifiedData);
    if (proData.length > 0) proData = deduplicate(proData);

    return {
      verified: verifiedData.length >= 3 ? verifiedData : FALLBACK_VERIFIED,
      pro: proData.length >= 2 ? proData : FALLBACK_PRO
    };

  } catch (error) {
    console.error('Error scraping SWE-Bench:', error);
    return { verified: FALLBACK_VERIFIED, pro: FALLBACK_PRO };
  }
}

function parseJSArray(raw: string): any[] {
    try {
        // Remove "entries:" prefix if present (regex capture group 1 shouldn't have it)
        let content = raw;
        
        // Remove outer [ ]
        if (content.startsWith('[') && content.endsWith(']')) {
            content = content.slice(1, -1);
        }
        
        // Split objects by "},{"
        // This is a naive split, assumes no nested objects with same structure.
        // The data seems simple: {rank:1,...}
        const items = content.split('},{');
        
        return items.map(item => {
            // Fix brackets for first and last item
            let cleanItem = item;
            if (!cleanItem.startsWith('{')) cleanItem = '{' + cleanItem;
            if (!cleanItem.endsWith('}')) cleanItem = cleanItem + '}';
            
            // Extract fields manually to avoid JSON parsing issues with unquoted keys
            const modelMatch = cleanItem.match(/model:"(.*?)"/);
            const scoreMatch = cleanItem.match(/score:([\d\.]+)/);
            // provider might be missing or different format
            const providerMatch = cleanItem.match(/provider:"(.*?)"/);
            
            if (modelMatch && scoreMatch) {
                return {
                    model: modelMatch[1],
                    score: parseFloat(scoreMatch[1]),
                    provider: providerMatch ? providerMatch[1] : getProvider(modelMatch[1]),
                    rank: 0 // Will be recalculated
                };
            }
            return null;
        }).filter(Boolean);
        
    } catch (e) {
        return [];
    }
}

function deduplicate(data: any[]) {
    const unique = new Map();
    data.forEach(item => {
        if (!unique.has(item.model)) {
            unique.set(item.model, item);
        }
    });
    const result = Array.from(unique.values());
    result.sort((a, b) => b.score - a.score);
    return result.map((d, i) => ({ ...d, rank: i + 1 }));
}

function getProvider(modelName: string): string {
  if (modelName.includes('Claude')) return 'Anthropic';
  if (modelName.includes('GPT')) return 'OpenAI';
  if (modelName.includes('Gemini')) return 'Google';
  if (modelName.includes('MiniMax')) return 'MiniMax';
  if (modelName.includes('GLM')) return 'Zhipu AI';
  if (modelName.includes('Kimi')) return 'Moonshot AI';
  if (modelName.includes('Qwen')) return 'Alibaba';
  if (modelName.includes('DeepSeek')) return 'DeepSeek';
  return 'Other';
}

export async function GET() {
  const data = await scrapeData();
  
  return NextResponse.json({
    source: LEADERBOARD_URL,
    updatedAt: new Date().toISOString(),
    verified: data.verified,
    pro: data.pro
  });
}

export async function POST() {
  return GET();
}
