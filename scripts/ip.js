import os from 'os';

const nets = os.networkInterfaces();
console.log('\n--- NETWORK ACCESS INFO ---');
let found = false;

for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    // Skip internal (loopback) and non-IPv4 addresses
    if (net.family === 'IPv4' && !net.internal) {
      console.log(`\x1b[32m%s\x1b[0m`, `➤ Device IP: ${net.address}`);
      console.log(`\x1b[36m%s\x1b[0m`, `➤ Link: https://${net.address}:3000`);
      console.log('---------------------------');
      found = true;
    }
  }
}

if (!found) {
  console.log('\x1b[31m%s\x1b[0m', 'No external IPv4 address found. Are you connected to Wi-Fi?');
}

console.log('\n\x1b[33m%s\x1b[0m', '--- QUICK STEPS FOR NETWORK ACCESS ---');
console.log('1. Run "npm run fix-network" ONCE as Admin to fix Firewall.');
console.log('2. Ensure Wi-Fi is set to PRIVATE (Settings > Network > Properties).');
console.log('3. Open the Link below. If you see a warning, click "Advanced" -> "Proceed".\n');
