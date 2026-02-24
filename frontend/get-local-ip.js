#!/usr/bin/env node
/**
 * Get Local IP Address
 * This script finds your local IP address on the network
 * Usage: node get-local-ip.js
 */

const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

const localIP = getLocalIP();
console.log(`Local IP Address: ${localIP}`);
console.log(`\nUse this IP to access your app from other devices:`);
console.log(`http://${localIP}:3000`);
console.log(`\nBackend API URL: http://${localIP}:5000/api`);
