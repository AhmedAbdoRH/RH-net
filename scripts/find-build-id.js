const fs = require('fs');
const content = fs.readFileSync('embed_page.html', 'utf8');

// Look for buildId
const match = content.match(/"buildId":"([^"]+)"/);
if (match) {
  console.log(`Build ID: ${match[1]}`);
} else {
  console.log('Build ID not found in JSON.');
  // Try to find generic pattern
  const match2 = content.match(/_next\/static\/([^/]+)\/_buildManifest\.js/);
  if (match2) {
      console.log(`Build ID from manifest path: ${match2[1]}`);
  }
}
