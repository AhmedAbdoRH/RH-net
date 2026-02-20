import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

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
    // Try to fetch from Firestore first
    const docRef = doc(db, "leaderboards", "arena");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return NextResponse.json(docSnap.data());
    }

    // Fallback to local file if Firestore is empty
    if (fs.existsSync(DATA_FILE_PATH)) {
      const fileContents = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      const data = JSON.parse(fileContents);
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: 'Data not found. Please run the scraper script first.' },
      { status: 404 }
    );
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

    // Save to Firestore
    await setDoc(doc(db, "leaderboards", "arena"), result);
    console.log(`✅ Arena.ai data updated successfully in Firestore! Total entries: ${rows.length}`);

    // Try to update local file as well (best effort, for dev/backup)
    try {
      const publicDir = path.dirname(DATA_FILE_PATH);
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(result, null, 2), "utf-8");
    } catch (fsError) {
      console.warn("Could not write to local file system (expected in production):", fsError);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating arena data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
