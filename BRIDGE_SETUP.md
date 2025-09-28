# ADK Bridge Connection Setup

This guide helps you fix the "ADK Bridge not running" issue in your ReliefOps app.

## 🔧 Quick Fix

The app has been updated with improved bridge connection logic. Here's what was fixed:

### 1. **Platform-Specific URLs**
- **iOS Simulator**: `http://localhost:8001` ✅
- **Android Emulator**: `http://10.0.2.2:8001` ✅  
- **Physical Devices**: `http://10.108.212.53:8001` ✅

### 2. **Enhanced Connection Logic**
- ✅ Retry mechanism (3 attempts with 2-second delays)
- ✅ Timeout handling (5-second timeout)
- ✅ Health check before running agents
- ✅ Better error messages and logging
- ✅ Automatic fallback to mock data

### 3. **Bridge Status Indicator**
- ✅ Visual connection status in the dashboard
- ✅ Tap to retry connection
- ✅ Real-time error messages

## 🚀 How to Test

### Step 1: Start Your ADK Bridge
```bash
# Make sure your Python ADK bridge is running on port 8001
python your_bridge_script.py
```

### Step 2: Start the React Native App
```bash
npm start
```

### Step 3: Check Connection Status
- Look for the **Bridge Status** card in the dashboard
- Green ✅ = Connected
- Red ❌ = Disconnected (tap to retry)
- Orange 🔄 = Connecting

## 🔍 Troubleshooting

### Issue: "Bridge not responding" on iOS Simulator
**Solution**: The app should connect automatically. If not:
1. Check that your bridge is running: `curl http://localhost:8001/`
2. Look at the console logs for connection attempts
3. Try tapping the bridge status card to retry

### Issue: "Bridge not responding" on Android Emulator
**Solution**: Android emulator uses `10.0.2.2` instead of `localhost`:
1. The app automatically uses the correct URL
2. Make sure your bridge is accessible from the emulator
3. Check firewall settings

### Issue: "Bridge not responding" on Physical Device
**Solution**: Use your computer's actual IP address:
1. Run: `node scripts/get-ip.js` to get your IP
2. Update `integration/BridgeConfig.js` with your IP
3. Make sure your device and computer are on the same network

### Issue: Bridge shows as connected but agents don't run
**Solution**: Check the health check:
1. The app now performs health checks before running agents
2. Look for "Bridge health check passed" in console logs
3. If health check fails, it will fallback to mock execution

## 📱 Platform-Specific Notes

### iOS Simulator
- Uses `localhost:8001`
- Should work out of the box
- Check that your bridge is running

### Android Emulator  
- Uses `10.0.2.2:8001`
- This is the emulator's way to access host machine's localhost
- No additional configuration needed

### Physical Devices
- Uses your computer's actual IP address
- Both devices must be on the same WiFi network
- Update IP in `BridgeConfig.js` if your IP changes

## 🔧 Configuration Files

### `integration/BridgeConfig.js`
```javascript
URLS: {
  ios: 'http://localhost:8001',
  android: 'http://10.0.2.2:8001', 
  web: 'http://localhost:8001',
  physical: 'http://10.108.212.53:8001', // Your IP
}
```

### `context/AppContext.js`
- Automatically selects the correct URL based on platform
- Includes retry logic and health checks
- Provides fallback to mock data

## 📊 Monitoring

The app now includes:
- **Real-time connection status** in the dashboard
- **Detailed console logging** for debugging
- **Automatic retry** on connection failures
- **Health checks** before running agents
- **Graceful fallback** to mock data

## 🆘 Still Having Issues?

1. **Check Bridge Status**: Look for the status card in the dashboard
2. **Check Console Logs**: Look for connection attempt messages
3. **Test Bridge Directly**: `curl http://localhost:8001/`
4. **Update IP Address**: Run `node scripts/get-ip.js` and update config
5. **Check Network**: Ensure devices are on the same network

## 📝 What Was Fixed

1. ✅ **Platform Detection**: Automatically uses correct URL for each platform
2. ✅ **Retry Logic**: 3 attempts with proper delays
3. ✅ **Timeout Handling**: 5-second timeout prevents hanging
4. ✅ **Health Checks**: Verifies bridge is healthy before running agents
5. ✅ **Error Handling**: Better error messages and fallback behavior
6. ✅ **UI Feedback**: Visual status indicator with retry option
7. ✅ **Configuration**: Easy-to-update IP address configuration

Your app should now properly connect to the ADK Bridge! 🎉
