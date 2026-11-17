const { exec, execSync, spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const PROJECT_DIR = "C:\\Users\\Ahmed\\RH-net-2";
const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Users\\Ahmed\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
];

// Read the dev port from package.json dev script (e.g. --port 9002)
function getDevPort() {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(PROJECT_DIR, "package.json"), "utf8")
    );
    const dev = pkg.scripts && pkg.scripts.dev;
    if (dev) {
      const m = dev.match(/(?:--port|-p)\s+(\d+)/);
      if (m) return parseInt(m[1]);
    }
  } catch {}
  return 3000;
}

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  try {
    const out = execSync(
      'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /v Path 2>nul',
      { encoding: "utf8" }
    );
    const m = out.match(/REG_SZ\s+(.+)/);
    if (m) {
      const p = path.join(m[1].trim(), "chrome.exe");
      if (fs.existsSync(p)) return p;
    }
  } catch {}
  return "chrome";
}

// Check if a port responds to HTTP requests
function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request(
      { hostname: "localhost", port, path: "/", method: "HEAD", timeout: 800 },
      () => resolve(true)
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

// Start dev server in the background
function startDevServer() {
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const child = spawn(npmCmd, ["run", "dev"], {
    cwd: PROJECT_DIR,
    detached: true,
    stdio: "ignore",
    shell: true,
    windowsHide: true,
  });
  child.unref();
}

function openUrl(url, chromePath) {
  if (chromePath && chromePath !== "chrome") {
    exec(`"${chromePath}" "${url}"`, { windowsHide: true });
  } else {
    exec(`start "" "${url}"`, { shell: true, windowsHide: true });
  }
}

async function main() {
  const chromePath = findChrome();
  const port = getDevPort();
  console.log(`Dev server port: ${port}`);

  // 1. If the server is not running yet, start it
  let reachable = await checkPort(port);
  if (!reachable) {
    console.log("Server not running. Starting dev server...");
    startDevServer();

    // 2. Poll until it responds (max 45 seconds)
    const startTime = Date.now();
    while (Date.now() - startTime < 45000) {
      await new Promise((r) => setTimeout(r, 1000));
      reachable = await checkPort(port);
      if (reachable) break;
    }
  }

  const targetUrl = `http://localhost:${port}`;
  console.log(`Opening ${targetUrl} ...`);
  openUrl(targetUrl, chromePath);

  if (!reachable) {
    console.log("Server did not respond in time, but Chrome was opened anyway.");
  }
}

main().catch(console.error);
