import { NextResponse } from 'next/server';
import { getFirestoreDoc, setFirestoreDoc } from '@/lib/firestore-rest';

// Dynamic import for CommonJS modules
let axios: typeof import('axios');
let cheerio: typeof import('cheerio');

async function loadScraperDeps() {
  if (!axios) {
    axios = await import('axios');
    cheerio = await import('cheerio');
  }
}

const URL_SOURCE = "https://arena.ai/ar/leaderboard/code";

/**
 * ملاحظة: لا نستخدم `fs` / `process.cwd()` هنا لأنهما غير متوفرين في
 * Cloudflare Workers. نجيب النسخة الاحتياطية عبر fetch للأصل الثابت.
 */
async function readFallbackData(requestUrl: string) {
  const res = await fetch(new URL('/data.json', requestUrl));
  if (!res.ok) return null;
  return await res.json();
}

export async function GET(request: Request) {
  try {
    // Try to fetch from Firestore first
    const existing = await getFirestoreDoc("leaderboards", "arena");

    if (existing) {
      return NextResponse.json(existing);
    }

    // Fallback to static asset if Firestore is empty
    const fallback = await readFallbackData(request.url);
    if (fallback) {
      return NextResponse.json(fallback);
    }

    return NextResponse.json(
      { error: 'Data not found. Please run the scraper script first.' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error reading arena data:', error);
    // Keep the leaderboard usable when Firestore is temporarily unavailable.
    try {
      const fallback = await readFallbackData(request.url);
      if (fallback) return NextResponse.json(fallback);
    } catch (fallbackError) {
      console.error('Error reading arena fallback data:', fallbackError);
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await loadScraperDeps();
    
    console.log("🚀 Starting manual scrape...");
    const { data: html } = await axios.default.get(URL_SOURCE, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    const $ = cheerio.load(html);
    const rows: Array<{rank: string, rankSpread: string, organization: string, model: string, license: string, score: string, confidence: string}> = [];

    $("table tbody tr").each((_i: number, el: any) => {
      const tds = $(el).find("td");
      
      const rank = tds.eq(0).text().trim();
      const rankSpread = tds.eq(1).find("span").map((_i: number, s: any) => $(s).text().trim()).get().join("-") || tds.eq(1).text().trim();

      const modelCell = tds.eq(2);
      const organization = modelCell.find("svg title").text().trim() || "Unknown";
      const modelName = modelCell.find("a").text().trim();
      const license = modelCell.find("span.text-text-secondary").text().trim();

      const scoreCell = tds.eq(3);
      const score = scoreCell.find("span").eq(0).text().trim();
      const confidence = scoreCell.find("span").eq(1).text().trim();

      if (rank && modelName) {
        rows.push({
          rank,
          rankSpread,
          organization,
          model: modelName,
          license,
          score,
          confidence
        });
      }
    });

    const result = {
      source: URL_SOURCE,
      updatedAt: new Date().toISOString(),
      total: rows.length,
      leaderboard: rows
    };

    // Save to Firestore
    await setFirestoreDoc("leaderboards", "arena", result);
    console.log(`✅ Arena.ai data updated successfully in Firestore! Total entries: ${rows.length}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating arena data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
