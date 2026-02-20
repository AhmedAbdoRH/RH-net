const axios = require('axios');
const cheerio = require('cheerio');

async function scrape() {
  try {
    const { data } = await axios.get('https://artificialanalysis.ai/leaderboards/models', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    
    // Log the first few table rows to see structure
    $('table tbody tr').slice(0, 5).each((i, el) => {
      const tds = $(el).find('td');
      console.log(`Row ${i}:`);
      tds.each((j, td) => {
        console.log(`  Col ${j}: ${$(td).text().trim()}`);
      });
    });

  } catch (error) {
    console.error(error);
  }
}

scrape();
