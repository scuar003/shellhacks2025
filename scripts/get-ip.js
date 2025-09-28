#!/usr/bin/env node

// Script to get your computer's IP address for ADK Bridge configuration
// Run this script to find the correct IP address to use in BridgeConfig.js

const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

const ipAddress = getLocalIPAddress();

console.log('🌐 Your computer\'s IP address:', ipAddress);
console.log('');
console.log('📝 Update BridgeConfig.js with this IP:');
console.log(`   physical: 'http://${ipAddress}:8001',`);
console.log('');
console.log('🔧 For different platforms:');
console.log('   iOS Simulator: http://localhost:8001');
console.log('   Android Emulator: http://10.0.2.2:8001');
console.log(`   Physical Devices: http://${ipAddress}:8001`);
console.log('');
console.log('⚠️  Make sure your ADK Bridge is running on port 8001');
