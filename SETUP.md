# ReliefOps Setup Instructions

## 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/reliefops.git
   cd reliefops
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Google ADK (Optional):**
   ```bash
   # Copy the template config
   cp integration/ADKConfig.template.js ADKConfig.js
   
   # Edit ADKConfig.js and add your Google ADK API key
   # Replace 'YOUR_GOOGLE_ADK_API_KEY_HERE' with your actual key
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Google ADK Integration (Optional)

If you want to use real Google ADK agents instead of mock data:

1. Get a Google ADK API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Copy `integration/ADKConfig.template.js` to `ADKConfig.js`
3. Replace `YOUR_GOOGLE_ADK_API_KEY_HERE` with your actual API key
4. Replace the mock API endpoints with your real disaster response APIs

### Mock Data

The app works out-of-the-box with mock data. No additional configuration needed.

## 📱 Running the App

- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal  
- **Web Browser**: Press `w` in the terminal
- **Mobile Device**: Scan QR code with Expo Go app

## 🎯 Features

- **3-Step Wizard**: Deploy Disaster Relief Coordinator
- **Live Dashboard**: Real-time KPIs and agent monitoring
- **Interactive Map**: Live data visualization with layer toggles
- **Alerts Feed**: Auto-updating emergency alerts
- **Agent Runs**: Timeline view of parallel agent executions

## 🔒 Security

- Never commit API keys to the repository
- Use environment variables for sensitive data
- The `.gitignore` file excludes sensitive configuration files

## 🆘 Troubleshooting

- **Metro bundler issues**: `npx expo start --clear`
- **iOS simulator not starting**: `npx expo run:ios`
- **Android emulator issues**: `npx expo run:android`
- **Dependency conflicts**: Delete `node_modules` and run `npm install`

## 📄 License

MIT License - see LICENSE file for details
