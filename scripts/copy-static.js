const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', '.next');
const targetDir = path.join(__dirname, '..', 'public');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy function that handles files and directories recursively
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  
  if (stat.isDirectory()) {
    // Create destination directory
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    // Copy all contents
    const files = fs.readdirSync(src);
    files.forEach(file => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      copyRecursive(srcPath, destPath);
    });
  } else {
    // Copy file
    const content = fs.readFileSync(src);
    fs.writeFileSync(dest, content);
  }
}

// Copy build output
if (fs.existsSync(sourceDir)) {
  console.log('Copying build output to public directory...');
  copyRecursive(sourceDir, targetDir);
  console.log('Build output copied successfully!');
} else {
  console.error('Source directory does not exist:', sourceDir);
  process.exit(1);
}