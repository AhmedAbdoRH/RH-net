import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Dynamic import for CommonJS modules
let axios: typeof import('axios');
let cheerio: typeof import('cheerio');

async function loadScraperDeps() {
  if (!axios) {
    axios = await import('axios');
    cheerio = await import('cheerio');
  }
}

const URL = "https://arena.ai/ar/leaderboard/code";
const DATA_FILE_PATH = path.join(process.cwd(), 'public', 'data.json');

export async function GET() {
  try {
    if (!fs.existsSync(DATA_FILE_PATH)) {
      return NextResponse.json(
        { error: 'Data not found. Please run the scraper script first.' },
        { status: 404 }
      );
    }

    const fileContents = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    const data = JSON.parse(fileContents);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading arena data:', error);
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
    const { data: html } = await axios.default.get(URL, {
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
      source: URL,
      updatedAt: new Date().toISOString(),
      total: rows.length,
      leaderboard: rows
    };

    // Ensure public directory exists
    const publicDir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(result, null, 2), "utf-8");

    console.log(`✅ Arena.ai data updated successfully! Total entries: ${rows.length}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error scraping arena data:', error);
    return NextResponse.json(
      { error: 'Failed to scrape data', details: String(error) },
      { status: 500 }
    );
  }
}
