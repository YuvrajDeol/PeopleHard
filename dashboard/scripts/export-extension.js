const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Helper to recursively read files
function getFiles(dir) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  });
  return files.flat();
}

function run() {
  const outDir = path.resolve(__dirname, '../out');
  const manifestPath = path.resolve(__dirname, '../../manifest.json');
  
  if (!fs.existsSync(outDir)) {
    console.error("Next.js out directory not found. Run npm run build first.");
    process.exit(1);
  }
  
  console.log("Analyzing exported HTML files for inline scripts...");
  const htmlFiles = getFiles(outDir).filter(file => file.endsWith('.html'));
  const hashes = new Set();
  
  const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
  
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
      const scriptContent = match[1];
      if (scriptContent.trim()) {
        const hash = crypto
          .createHash('sha256')
          .update(scriptContent)
          .digest('base64');
        hashes.add(`'sha256-${hash}'`);
      }
    }
  }
  
  const hashList = Array.from(hashes).join(' ');
  console.log(`Found ${hashes.size} unique inline scripts. Hashes generated.`);
  
  // Read and update manifest.json
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Add hashes to extension_pages CSP (fully Manifest V3 compliant)
    manifest.content_security_policy = {
      extension_pages: `script-src 'self' ${hashList}; object-src 'self';`
    };
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log("Successfully updated manifest.json CSP with script hashes.");
  } else {
    console.warn("manifest.json not found at expected path:", manifestPath);
  }
  
  // Copy static output to extension root
  const extensionDir = path.resolve(__dirname, '../../');
  console.log("Copying static assets to extension root directory...");
  copyRecursiveSync(outDir, extensionDir);
  console.log("Dashboard assets copied successfully to extension!");
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    if (path.basename(src) === 'manifest.json') return;
    fs.copyFileSync(src, dest);
  }
}

run();
