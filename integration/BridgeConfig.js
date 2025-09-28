// ADK Bridge Configuration
// Update these settings based on your network setup

import Constants from 'expo-constants';

export const BRIDGE_CONFIG = {
  // Bridge server configuration
  HOST: 'localhost',  // Change to your computer's IP address for physical devices
  PORT: 8001,
  
  // Platform-specific URLs
  URLS: {
    // iOS Simulator
    ios: 'http://localhost:8001',
    
    // Android Emulator  
    android: 'http://10.0.2.2:8001',
    
    // Web/Development
    web: 'http://localhost:8001',
    
    // Physical devices - replace with your actual IP
    // Find your IP with: ifconfig | grep "inet " | grep -v 127.0.0.1
    physical: 'http://10.108.212.53:8001', // Your actual IP address
  },
  
  // Connection settings
  CONNECTION: {
    timeout: 5000,        // 5 seconds
    retries: 3,           // Number of retry attempts
    retryDelay: 2000,     // Delay between retries (ms)
  },
  
  // Health check settings
  HEALTH_CHECK: {
    enabled: true,
    interval: 30000,      // Check every 30 seconds
    timeout: 3000,        // 3 second timeout for health checks
  },
  
  // Logging
  LOGGING: {
    enabled: true,
    level: 'info',        // 'debug', 'info', 'warn', 'error'
  }
};

// Helper: derive the Expo host (LAN IP) when running on a device
const getExpoHost = () => {
  try {
    // SDK 54 exposes config under Constants.expoConfig in dev, and extra.expoClient.hostUri in runtime payload
    const possibleHosts = [];
    if (Constants?.expoConfig?.hostUri) possibleHosts.push(Constants.expoConfig.hostUri);
    if (Constants?.manifest2?.extra?.expoClient?.hostUri) possibleHosts.push(Constants.manifest2.extra.expoClient.hostUri);
    if (Constants?.manifest?.hostUri) possibleHosts.push(Constants.manifest.hostUri);
    if (Constants?.expoConfig?._internal?.projectRoot) {
      // no host here, but keep for completeness
    }
    for (const host of possibleHosts) {
      if (typeof host === 'string' && host.includes(':')) {
        const hostname = host.split(':')[0];
        // If it's a loopback, skip; we want LAN IP when on device
        if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
          return hostname;
        }
      }
    }
  } catch {}
  return null;
};

// Helper function to get the appropriate bridge URL
export const getBridgeURL = (platform = 'web') => {
  // Prefer Expo host (LAN IP) if available - works on physical devices over the same network
  const expoHost = getExpoHost();
  if (expoHost) {
    return `http://${expoHost}:8001`;
  }

  if (__DEV__) {
    return BRIDGE_CONFIG.URLS[platform] || BRIDGE_CONFIG.URLS.web;
  }
  return BRIDGE_CONFIG.URLS.physical;
};

// Helper function to get your computer's IP address
export const getComputerIP = async () => {
  try {
    // This would need to be implemented based on your setup
    // For now, return the configured IP
    return BRIDGE_CONFIG.URLS.physical.replace('http://', '').replace(':8001', '');
  } catch (error) {
    console.warn('Could not determine computer IP:', error);
    return '192.168.1.100'; // Fallback IP
  }
};
