const cron = require("node-cron");
const { exec } = require("child_process");
const path = require("path");

const SCRAPER_SCRIPT = path.join(__dirname, "scraper.js");

console.log("⏳ Daily Scheduler Initialized...");
console.log(`📅 Scheduled to run at 03:00 AM daily.`);

// Schedule: 0 3 * * * (At 03:00 AM)
cron.schedule("0 3 * * *", () => {
  console.log(`⏰ [${new Date().toISOString()}] Starting scheduled scraping job...`);
  
  exec(`node "${SCRAPER_SCRIPT}"`, (err, stdout, stderr) => {
    if (err) {
        console.error("❌ Cron Job Error:", err);
        return;
    }
    if (stderr) {
        console.error("⚠️ Scraper Stderr:", stderr);
    }
    console.log("✅ Scraper Output:", stdout);
  });
});

// Run immediately on startup to ensure data exists
console.log("🔄 Running initial scrape...");
exec(`node "${SCRAPER_SCRIPT}"`, (err, stdout, stderr) => {
    if (err) console.error("❌ Initial Run Error:", err);
    else console.log("✅ Initial Run Output:", stdout);
});
