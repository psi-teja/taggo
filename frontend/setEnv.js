const os = require('os');
const fs = require('fs');
const path = require('path');

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const ipAddress = getLocalIpAddress();
const envFilePath = path.join(__dirname, '.env');
const envFileContent = `NEXT_PUBLIC_API_BASE_URL=http://${ipAddress}:5000\n`;

fs.writeFileSync(envFilePath, envFileContent, { encoding: 'utf8' });

console.log(`.env file updated with IP address: ${ipAddress}`);