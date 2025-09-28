# ReliefOps - Disaster Relief Coordinator

A React Native mobile app that showcases an autonomous disaster-response workflow using simulated Google ADK/A2A agents. Built for hackathon demos with a focus on functionality and design.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Run on device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app

## 📱 Features

### Core Workflow
- **3-Step Wizard**: Deploy a Disaster Relief Coordinator for any region
- **Live Dashboard**: Real-time KPIs and parallel agent monitoring
- **Interactive Map**: Live data visualization with layer toggles
- **Alerts Feed**: Auto-updating emergency alerts with filtering
- **Agent Runs**: Timeline view of parallel agent executions with A2A handoffs

### Agent System
- **News Agent**: Monitors official feeds, social media, and news sources
- **Mapping Agent**: Processes geographical data and infrastructure status
- **Logistics Agent**: Manages supply chains and resource distribution
- **Coordinator**: Main orchestrator with A2A coordination capabilities

### Design Features
- **Dark Theme**: Emergency-ops aesthetic with red/orange/yellow accents
- **Real-time Updates**: 20-second intervals for live data simulation
- **Micro-animations**: Progress bars, pulsing indicators, confetti effects
- **Responsive UI**: Optimized for mobile with clean, modern design

## 🏗️ Architecture

### Tech Stack
- **React Native** with Expo
- **React Navigation** for navigation
- **React Context** for state management
- **React Native Maps** for mapping
- **Expo Vector Icons** for icons
- **Animated API** for animations

### Project Structure
```
/
├── App.js                          # Main app component
├── navigation/
│   └── RootNavigator.js            # Navigation setup
├── screens/
│   ├── SplashScreen.js             # Welcome screen
│   ├── DashboardScreen.js          # Main dashboard
│   ├── MapScreen.js                # Interactive map
│   ├── AlertsScreen.js             # Alerts feed
│   ├── RunsScreen.js               # Agent runs timeline
│   └── Wizard/                     # 3-step deployment wizard
│       ├── StepRegion.js
│       ├── StepFeeds.js
│       └── StepPlan.js
├── components/
│   ├── KPICard.js                  # KPI display component
│   ├── AgentCard.js                # Agent status component
│   ├── LayerChips.js               # Map layer toggles
│   ├── AlertCard.js                # Alert display component
│   └── RunItem.js                  # Run timeline item
├── context/
│   └── AppContext.js               # Global state management
├── theme/
│   └── colors.js                   # Design system constants
└── assets/mock/                    # Mock data files
    ├── shelters.json
    ├── closures.json
    ├── supplies.json
    └── alerts.json
```

## 🔧 Mock Data & Simulation

The app uses mock JSON data to simulate real disaster response scenarios:

- **Shelters**: Capacity, occupancy, status updates
- **Road Closures**: Location, cause, ETA for reopening
- **Supply Sites**: Item types, stock levels, locations
- **Alerts**: Severity levels, sources, timestamps

### Auto-updates
- New alerts every 20 seconds
- KPI updates (shelter occupancy, etc.)
- Agent status changes
- Map marker updates

## 🎯 Demo Flow

1. **Launch**: Splash screen with "Get Started" button
2. **Wizard**: 
   - Select region (Miami, Tampa, etc.)
   - Choose data feeds (Official, Social, Crowd)
   - Review agent plan and deploy
3. **Dashboard**: 
   - View KPIs and agent status
   - Trigger manual agent runs
   - Navigate to other screens
4. **Map**: 
   - Toggle data layers
   - View markers with callouts
   - Refresh data manually
5. **Alerts**: 
   - Filter by severity
   - Pull-to-refresh for new alerts
   - Real-time updates
6. **Runs**: 
   - View agent execution timeline
   - Enable auto-run mode
   - Expand run details

## 🔌 API Integration Points

The following functions are stubbed for easy ADK/A2A integration:

### Context/AppContext.js
```javascript
// Replace these mock functions with real API calls:
- runAllAgents()           // Trigger agent execution
- dispatch() calls         // Update state from API responses
- setInterval() loops      // Replace with WebSocket connections
```

### Mock Data Replacement
```javascript
// Replace /assets/mock/*.json with API endpoints:
- shelters.json    → GET /api/shelters
- closures.json    → GET /api/closures  
- supplies.json    → GET /api/supplies
- alerts.json      → GET /api/alerts
```

### Real-time Updates
```javascript
// Replace setInterval with WebSocket:
- Alerts feed      → WebSocket /ws/alerts
- Map updates      → WebSocket /ws/map
- Agent status     → WebSocket /ws/agents
```

## 🎨 Design System

### Colors
- **Background**: #0B0B0C (near-black)
- **Surfaces**: #1A1A1B, #2A2A2B (grays)
- **Accents**: Red #E53935, Orange #FB8C00, Yellow #FFD54F
- **Text**: #F5F5F5 (primary), #9E9E9E (secondary)

### Components
- **Cards**: Rounded corners (12-24px), soft shadows
- **Chips**: Pill-shaped status indicators
- **Buttons**: Full-width with icons, rounded corners
- **Progress**: Animated bars with status colors

## 📱 Platform Support

- **iOS**: Tested on iOS 13+
- **Android**: Tested on Android 8+
- **Expo Go**: Full compatibility
- **Development**: Hot reloading enabled

## 🚀 Deployment

### Expo Build
```bash
# Build for production
expo build:android
expo build:ios

# Or use EAS Build
eas build --platform all
```

### App Store Submission
1. Configure app.json with proper metadata
2. Add app icons and splash screens
3. Build and submit through Expo/EAS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section below
2. Open an issue on GitHub
3. Contact the development team

## 🔧 Troubleshooting

### Common Issues

**Metro bundler issues:**
```bash
npx expo start --clear
```

**iOS simulator not starting:**
```bash
npx expo run:ios
```

**Android emulator issues:**
```bash
npx expo run:android
```

**Dependency conflicts:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

**Built with ❤️ for disaster response coordination**
