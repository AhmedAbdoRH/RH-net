const fs = require('fs');

try {
  const content = fs.readFileSync('embed_page.html', 'utf8');
  const index = content.indexOf('Gemini 1.5 Pro');
  
  if (index !== -1) {
    console.log(`Found "Gemini 1.5 Pro" at index ${index}`);
    // Print 500 chars before and after
    const start = Math.max(0, index - 500);
    const end = Math.min(content.length, index + 500);
    console.log(content.substring(start, end));
  } else {
    console.log('String "Gemini 1.5 Pro" not found.');
    // Try simpler
    const index2 = content.indexOf('Gemini');
    if (index2 !== -1) {
        console.log(`Found "Gemini" at index ${index2}`);
        const start = Math.max(0, index2 - 500);
        const end = Math.min(content.length, index2 + 500);
        console.log(content.substring(start, end));
    }
  }
} catch (err) {
  console.error(err);
}
