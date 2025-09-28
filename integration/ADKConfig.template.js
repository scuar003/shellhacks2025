// Google ADK Configuration Template
// Copy this file to ADKConfig.js and add your actual API keys

export const ADK_CONFIG = {
  // Google ADK API Configuration
  API_KEY: 'YOUR_GOOGLE_ADK_API_KEY_HERE', // Replace with your actual API key
  
  // Model Configuration
  MODELS: {
    NEWS_AGENT: 'gemini-1.5-pro',
    MAPPING_AGENT: 'gemini-1.5-pro', 
    LOGISTICS_AGENT: 'gemini-1.5-pro',
    COORDINATOR: 'gemini-1.5-pro',
  },

  // Agent Prompts (customize for your use case)
  PROMPTS: {
    NEWS_AGENT: {
      system: `You are a News Agent for disaster relief. Monitor official feeds, social media, and news sources for disaster-related information. Focus on: road closures, shelter status, supply needs, weather alerts, emergency services updates. Return structured JSON with findings.`,
      task: `Analyze current disaster situation in the region. Check for: new road closures, shelter capacity updates, supply needs, weather alerts. Return structured JSON with findings.`
    },
    
    MAPPING_AGENT: {
      system: `You are a Mapping Agent for disaster relief. Process geographical data, update maps, track infrastructure status. Focus on: shelter locations, road conditions, supply distribution points, evacuation routes. Return structured JSON with map updates.`,
      task: `Update geographical data for disaster response. Process: shelter locations, road conditions, supply points, evacuation routes. Return structured JSON with map updates.`
    },
    
    LOGISTICS_AGENT: {
      system: `You are a Logistics Agent for disaster relief. Manage supply chains, resource distribution, operational logistics. Focus on: inventory levels, delivery routes, resource allocation, capacity planning. Return structured JSON with logistics updates.`,
      task: `Analyze logistics and supply chain status. Check: inventory levels, delivery routes, resource allocation, capacity planning. Return structured JSON with logistics updates.`
    },
    
    COORDINATOR: {
      system: `You are the Disaster Relief Coordinator. Orchestrate all sub-agents, make decisions, coordinate A2A handoffs. Synthesize information from News, Mapping, and Logistics agents to provide actionable insights. Return structured JSON with coordination decisions.`,
      task: `As the Disaster Relief Coordinator, synthesize information from sub-agents and provide: priority actions, resource allocation, coordination recommendations. Return structured JSON with coordination decisions.`
    }
  },

  // External API Endpoints (replace with your actual endpoints)
  API_ENDPOINTS: {
    SHELTERS: 'https://your-api.com/api/shelters',
    CLOSURES: 'https://your-api.com/api/road-closures', 
    SUPPLIES: 'https://your-api.com/api/supply-sites',
    ALERTS: 'https://your-api.com/api/alerts',
    WEATHER: 'https://your-api.com/api/weather',
    NEWS: 'https://your-api.com/api/news-feeds',
  },

  // API Headers (add authentication if needed)
  API_HEADERS: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_TOKEN', // Replace with your API token
  },

  // Update Intervals (in milliseconds)
  INTERVALS: {
    REAL_TIME_DATA: 20000,    // 20 seconds
    AUTO_RUN: 60000,          // 1 minute
    AGENT_STATUS: 5000,       // 5 seconds
  },

  // Error Handling
  ERROR_HANDLING: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,        // 1 second
    FALLBACK_TO_MOCK: true,   // Use mock data if ADK fails
  },

  // Logging
  LOGGING: {
    ENABLED: true,
    LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
    LOG_AGENT_RESPONSES: true,
  }
};

// Helper function to get API endpoint
export const getApiEndpoint = (endpoint) => {
  return ADK_CONFIG.API_ENDPOINTS[endpoint];
};

// Helper function to get agent prompt
export const getAgentPrompt = (agent, type = 'task') => {
  return ADK_CONFIG.PROMPTS[agent][type];
};

// Helper function to get model name
export const getModelName = (agent) => {
  return ADK_CONFIG.MODELS[agent];
};
