const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceDir = path.join(__dirname, '..', '.next');
const targetDir = path.join(__dirname, '..', 'public');

// Clean target directory first
if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  console.log('Cleaned existing public directory');
}

// Create target directory
fs.mkdirSync(targetDir, { recursive: true });

// Copy function that resolves symlinks
function copyRecursive(src, dest) {
  const stat = fs.lstatSync(src);
  
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
  } else if (stat.isSymbolicLink()) {
    // Resolve symlink and copy the actual file
    const realPath = fs.realpathSync(src);
    const realStat = fs.statSync(realPath);
    
    if (realStat.isDirectory()) {
      copyRecursive(realPath, dest);
    } else {
      const content = fs.readFileSync(realPath);
      fs.writeFileSync(dest, content);
    }
  } else {
    // Copy regular file
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