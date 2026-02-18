const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const URL = "https://arena.ai/ar/leaderboard/code";
const DATA_FILE_PATH = path.join(__dirname, "../public/data.json");

async function scrapeArena() {
  console.log("🚀 Starting scraper...");
  try {
    const { data } = await axios.get(URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    const $ = cheerio.load(data);
    const rows = [];

    // Note: The selector might need adjustment if the site uses specific classes or dynamic rendering.
    // Based on user input:
    $("table tbody tr").each((i, el) => {
      const tds = $(el).find("td");
      
      // Rank: 1
      const rank = tds.eq(0).text().trim();

      // Rank Spread: 1-2 (spans are 1 and 2)
      const rankSpread = tds.eq(1).find("span").map((i, s) => $(s).text().trim()).get().join("-") || tds.eq(1).text().trim();

      // Model Cell
      const modelCell = tds.eq(2);
      const organization = modelCell.find("svg title").text().trim() || "Unknown";
      const modelName = modelCell.find("a").text().trim();
      const license = modelCell.find("span.text-text-secondary").text().trim(); // "Anthropic · Proprietary"

      // Score Cell
      const scoreCell = tds.eq(3);
      const score = scoreCell.find("span").eq(0).text().trim();
      const confidence = scoreCell.find("span").eq(1).text().trim(); // "+15/-15"

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

    console.log(`✅ Arena.ai data updated successfully! Saved to: ${DATA_FILE_PATH}`);
    console.log(`📊 Total entries: ${rows.length}`);

  } catch (error) {
    console.error("❌ Scraping Error:", error.message);
  }
}

scrapeArena();
