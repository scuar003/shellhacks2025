# Google ADK Integration Guide for ReliefOps

This guide shows you exactly how to integrate your Google ADK agents into the ReliefOps app.

## 🚀 Quick Integration Steps

### 1. Install Google ADK Dependencies

```bash
npm install @google/generative-ai
```

### 2. Replace AppContext.js

Replace your existing `context/AppContext.js` with the ADK-integrated version:

```bash
# Backup your current AppContext
cp context/AppContext.js context/AppContext.backup.js

# Replace with ADK version
cp integration/AppContextWithADK.js context/AppContext.js
```

### 3. Add ADK Integration Files

Copy the integration files to your project:

```bash
# Copy ADK integration
cp integration/ADKIntegration.js ./ADKIntegration.js
cp integration/ADKConfig.js ./ADKConfig.js
```

### 4. Configure Your API Key

Edit `ADKConfig.js` and replace the placeholder:

```javascript
export const ADK_CONFIG = {
  API_KEY: 'YOUR_ACTUAL_GOOGLE_ADK_API_KEY_HERE',
  // ... rest of config
};
```

### 5. Update API Endpoints

Replace the mock API endpoints in `ADKConfig.js` with your real disaster response APIs:

```javascript
API_ENDPOINTS: {
  SHELTERS: 'https://your-disaster-api.com/api/shelters',
  CLOSURES: 'https://your-disaster-api.com/api/road-closures', 
  SUPPLIES: 'https://your-disaster-api.com/api/supply-sites',
  ALERTS: 'https://your-disaster-api.com/api/alerts',
  // Add your actual endpoints
},
```

## 🔧 Detailed Integration Points

### A. Agent Initialization

**Location**: `ADKIntegration.js` → `initializeAgents()`

**What to customize**:
- Agent system instructions
- Model selection (gemini-1.5-pro, gemini-1.5-flash, etc.)
- Region-specific prompts

**Example customization**:
```javascript
// Customize for your specific disaster response needs
this.agents.news = this.genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro",
  systemInstruction: `You are a News Agent for ${region} disaster relief. 
  Monitor ${selectedFeeds.join(', ')} feeds for:
  - Hurricane updates
  - Flood warnings  
  - Evacuation orders
  - Emergency shelter openings
  - Road closure announcements`
});
```

### B. Agent Execution

**Location**: `ADKIntegration.js` → `runNewsAgent()`, `runMappingAgent()`, `runLogisticsAgent()`

**What to customize**:
- Agent prompts for your specific use case
- Data parsing logic
- Error handling

**Example customization**:
```javascript
async runNewsAgent() {
  try {
    const prompt = `Analyze disaster situation for ${this.region}.
    Check: hurricane updates, flood warnings, evacuation orders.
    Return JSON: {alerts: [], shelters: [], closures: []}`;
    
    const result = await this.agents.news.generateContent(prompt);
    // ... rest of implementation
  } catch (error) {
    // Handle errors
  }
}
```

### C. A2A Handoffs

**Location**: `ADKIntegration.js` → `runCoordinator()`

**What to customize**:
- Coordinator decision logic
- A2A handoff protocols
- Data synthesis rules

**Example customization**:
```javascript
async runCoordinator(newsData, mappingData, logisticsData) {
  const prompt = `As Disaster Relief Coordinator, synthesize:
  
  News: ${JSON.stringify(newsData)}
  Maps: ${JSON.stringify(mappingData)}  
  Logistics: ${JSON.stringify(logisticsData)}
  
  Provide: priority actions, resource allocation, coordination decisions.
  Return JSON with: {priority: [], resources: {}, coordination: []}`;
  
  // ... implementation
}
```

### D. Real-time Data Integration

**Location**: `ADKIntegration.js` → `fetchRealTimeData()`

**What to customize**:
- Your disaster response API endpoints
- Data transformation logic
- Authentication headers

**Example customization**:
```javascript
async fetchShelters() {
  const response = await fetch(ADK_CONFIG.API_ENDPOINTS.SHELTERS, {
    headers: ADK_CONFIG.API_HEADERS,
    method: 'GET'
  });
  
  const data = await response.json();
  
  // Transform data to match app format
  return data.map(shelter => ({
    id: shelter.id,
    name: shelter.name,
    lat: shelter.latitude,
    lng: shelter.longitude,
    capacity: shelter.max_capacity,
    occupied: shelter.current_occupancy,
    status: shelter.status,
    updated: shelter.last_updated
  }));
}
```

## 🎯 Integration Workflow

### Phase 1: Basic Integration
1. ✅ Install dependencies
2. ✅ Replace AppContext.js
3. ✅ Add API key
4. ✅ Test with mock data

### Phase 2: Real Data Integration
1. 🔄 Replace mock API calls with real endpoints
2. 🔄 Test data fetching
3. 🔄 Verify data format compatibility

### Phase 3: Agent Customization
1. 🔄 Customize agent prompts for your use case
2. 🔄 Test individual agents
3. 🔄 Verify A2A handoffs

### Phase 4: Production Deployment
1. 🔄 Add error handling
2. 🔄 Implement logging
3. 🔄 Performance optimization
4. 🔄 Deploy to production

## 🔍 Testing Your Integration

### Test Individual Agents
```javascript
// In your app, test each agent
const adkManager = new ADKAgentManager('YOUR_API_KEY');
await adkManager.initializeAgents('Miami, FL', ['Official']);

const newsResult = await adkManager.runNewsAgent();
console.log('News Agent Result:', newsResult);
```

### Test Full Workflow
```javascript
// Test complete agent workflow
const result = await runAllAgents();
console.log('Full Workflow Result:', result);
```

### Test Real-time Data
```javascript
// Test data fetching
const realTimeData = await adkManager.fetchRealTimeData();
console.log('Real-time Data:', realTimeData);
```

## 🚨 Common Issues & Solutions

### Issue: "Cannot find module '@google/generative-ai'"
**Solution**: Run `npm install @google/generative-ai`

### Issue: "API key not valid"
**Solution**: Check your Google ADK API key in `ADKConfig.js`

### Issue: "Agent responses not parsing correctly"
**Solution**: Customize `parseAgentResponse()` in `ADKIntegration.js`

### Issue: "Real-time data not updating"
**Solution**: Check your API endpoints and authentication in `ADKConfig.js`

## 📊 Monitoring & Debugging

### Enable Logging
```javascript
// In ADKConfig.js
LOGGING: {
  ENABLED: true,
  LEVEL: 'debug',
  LOG_AGENT_RESPONSES: true,
}
```

### Monitor Agent Performance
```javascript
// Add performance monitoring
const startTime = Date.now();
const result = await agent.generateContent(prompt);
const duration = Date.now() - startTime;
console.log(`Agent execution time: ${duration}ms`);
```

## 🎉 Success Indicators

You'll know your integration is working when:

1. ✅ Agents initialize without errors
2. ✅ Real-time data updates every 20 seconds
3. ✅ Agent runs complete successfully
4. ✅ A2A handoffs work between agents
5. ✅ Coordinator synthesizes data correctly
6. ✅ UI updates with real data

## 🔄 Next Steps

After successful integration:

1. **Customize Prompts**: Tailor agent prompts for your specific disaster response needs
2. **Add More Agents**: Extend with additional specialized agents
3. **Implement Caching**: Add response caching for better performance
4. **Add Analytics**: Track agent performance and decision quality
5. **Scale Up**: Deploy to production with proper monitoring

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.
