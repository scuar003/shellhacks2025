// Modified AppContext.js that connects to the ADK Bridge
// This version connects to your Python ADK agents via HTTP

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Platform } from 'react-native';
import { colors } from '../theme/colors';
import { getBridgeURL, BRIDGE_CONFIG } from '../integration/BridgeConfig';

// Get the appropriate bridge URL based on platform
const ADK_BRIDGE_URL = getBridgeURL(Platform.OS);

const AppContext = createContext();

const initialState = {
  // App state
  isInitialized: false,
  currentRegion: null,
  selectedFeeds: ['Official'],
  
  // Agent state
  agents: {
    news: { status: 'idle', lastRun: null, progress: 0 },
    mapping: { status: 'idle', lastRun: null, progress: 0 },
    logistics: { status: 'idle', lastRun: null, progress: 0 },
  },
  
  // Data state
  shelters: [],
  closures: [],
  supplies: [],
  alerts: [],
  
  // UI state
  mapLayers: {
    shelters: true,
    closures: true,
    supplies: true,
  },
  
  // Monitoring state
  isMonitoring: false,
  autoRunEnabled: false,
  
  // Runs history
  runs: [],
  
  // Notifications
  newAlertsCount: 0,

  // Bridge connection
  bridgeConnected: false,
  bridgeError: null,
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'INITIALIZE_APP':
      return { ...state, isInitialized: true };
      
    case 'SET_BRIDGE_STATUS':
      return { 
        ...state, 
        bridgeConnected: action.payload.connected,
        bridgeError: action.payload.error 
      };
      
    case 'SET_REGION':
      return { ...state, currentRegion: action.payload };
      
    case 'SET_FEEDS':
      return { ...state, selectedFeeds: action.payload };
      
    case 'UPDATE_AGENT_STATUS':
      return {
        ...state,
        agents: {
          ...state.agents,
          [action.payload.agent]: {
            ...state.agents[action.payload.agent],
            ...action.payload.updates,
          },
        },
      };
      
    case 'UPDATE_DATA':
      return {
        ...state,
        [action.payload.type]: action.payload.data,
      };
      
    case 'ADD_ALERT':
      return {
        ...state,
        alerts: [action.payload, ...state.alerts],
        newAlertsCount: state.newAlertsCount + 1,
      };
      
    case 'CLEAR_NEW_ALERTS':
      return { ...state, newAlertsCount: 0 };
      
    case 'TOGGLE_MAP_LAYER':
      return {
        ...state,
        mapLayers: {
          ...state.mapLayers,
          [action.payload]: !state.mapLayers[action.payload],
        },
      };
      
    case 'SET_MONITORING':
      return { ...state, isMonitoring: action.payload };
      
    case 'SET_AUTO_RUN':
      return { ...state, autoRunEnabled: action.payload };
      
    case 'ADD_RUN':
      return {
        ...state,
        runs: [action.payload, ...state.runs.slice(0, 9)],
      };
      
    case 'UPDATE_KPIS':
      return {
        ...state,
        shelters: action.payload.shelters || state.shelters,
        closures: action.payload.closures || state.closures,
        supplies: action.payload.supplies || state.supplies,
      };
      
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize app and check bridge connection
  useEffect(() => {
    const initializeApp = async () => {
      let retries = BRIDGE_CONFIG.CONNECTION.retries;
      let connected = false;
      
      while (retries > 0 && !connected) {
        try {
          if (BRIDGE_CONFIG.LOGGING.enabled) {
            console.log(`🔍 Attempting to connect to ADK Bridge at ${ADK_BRIDGE_URL}... (${BRIDGE_CONFIG.CONNECTION.retries - retries + 1}/${BRIDGE_CONFIG.CONNECTION.retries})`);
          }
          
          // Check if ADK bridge is running with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), BRIDGE_CONFIG.CONNECTION.timeout);
          
          const response = await fetch(`${ADK_BRIDGE_URL}/`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            },
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            if (BRIDGE_CONFIG.LOGGING.enabled) {
              console.log('✅ Connected to ADK Bridge:', data);
            }
            dispatch({ 
              type: 'SET_BRIDGE_STATUS', 
              payload: { connected: true, error: null } 
            });
            connected = true;
          } else {
            throw new Error(`Bridge responded with status: ${response.status}`);
          }
        } catch (error) {
          retries--;
          if (BRIDGE_CONFIG.LOGGING.enabled) {
            console.warn(`⚠️ ADK Bridge connection attempt failed (${BRIDGE_CONFIG.CONNECTION.retries - retries}/${BRIDGE_CONFIG.CONNECTION.retries}):`, error.message);
          }
          
          if (retries === 0) {
            if (BRIDGE_CONFIG.LOGGING.enabled) {
              console.warn('❌ All ADK Bridge connection attempts failed, using mock data');
            }
            dispatch({ 
              type: 'SET_BRIDGE_STATUS', 
              payload: { connected: false, error: `Failed to connect: ${error.message}` } 
            });
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, BRIDGE_CONFIG.CONNECTION.retryDelay));
          }
        }
      }
      
      dispatch({ type: 'INITIALIZE_APP' });
    };

    initializeApp();
  }, []);

  // Real-time data updates
  useEffect(() => {
    if (!state.isMonitoring) return;

    const updateData = async () => {
      if (!state.bridgeConnected) return;
      
      try {
        // Fetch data from ADK bridge
        const [shelters, closures, supplies, alerts] = await Promise.all([
          fetch(`${ADK_BRIDGE_URL}/api/data/shelters`).then(r => r.json()),
          fetch(`${ADK_BRIDGE_URL}/api/data/closures`).then(r => r.json()),
          fetch(`${ADK_BRIDGE_URL}/api/data/supplies`).then(r => r.json()),
          fetch(`${ADK_BRIDGE_URL}/api/data/alerts`).then(r => r.json()),
        ]);

        // Update data in state
        dispatch({ type: 'UPDATE_DATA', payload: { type: 'shelters', data: shelters } });
        dispatch({ type: 'UPDATE_DATA', payload: { type: 'closures', data: closures } });
        dispatch({ type: 'UPDATE_DATA', payload: { type: 'supplies', data: supplies } });
        dispatch({ type: 'UPDATE_DATA', payload: { type: 'alerts', data: alerts } });
        
      } catch (error) {
        console.error('Error updating data from bridge:', error);
      }
    };

    const interval = setInterval(updateData, 20000); // Every 20 seconds
    return () => clearInterval(interval);
  }, [state.isMonitoring, state.bridgeConnected]);

  // Auto-run with ADK agents
  useEffect(() => {
    if (!state.autoRunEnabled || !state.bridgeConnected) return;

    const interval = setInterval(() => {
      runAllAgents();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [state.autoRunEnabled, state.bridgeConnected]);

  // Check bridge health
  const checkBridgeHealth = async () => {
    if (!BRIDGE_CONFIG.HEALTH_CHECK.enabled) return true;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BRIDGE_CONFIG.HEALTH_CHECK.timeout);
      
      const response = await fetch(`${ADK_BRIDGE_URL}/`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (BRIDGE_CONFIG.LOGGING.enabled) {
          console.log('🔍 Bridge health check passed:', data);
        }
        return true;
      }
      return false;
    } catch (error) {
      if (BRIDGE_CONFIG.LOGGING.enabled) {
        console.warn('🔍 Bridge health check failed:', error.message);
      }
      return false;
    }
  };

  // Test bridge API endpoint
  const testBridgeAPI = async () => {
    try {
      console.log('🧪 Testing bridge API endpoint...');
      
      // Test a simple GET request first
      const healthResponse = await fetch(`${ADK_BRIDGE_URL}/`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }
      
      const healthData = await healthResponse.json();
      console.log('✅ Bridge health check passed:', healthData);
      
      // Test the run-agents endpoint with correct format
      const testFeeds = ['Official'];
      
      console.log('🧪 Testing run-agents endpoint...');
      const testFormData = new FormData();
      testFeeds.forEach(feed => {
        testFormData.append('feeds', feed);
      });
      
      const testResponse = await fetch(`${ADK_BRIDGE_URL}/api/run-agents`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: testFormData,
      });
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('✅ Bridge API test passed:', testData);
        return true;
      } else {
        const errorText = await testResponse.text();
        console.warn('⚠️ Bridge API test failed:', testResponse.status, errorText);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Bridge API test error:', error.message);
      return false;
    }
  };

  // Main function to run all agents via ADK bridge
  const runAllAgents = async () => {
    // First check if bridge is still connected
    const isHealthy = await checkBridgeHealth();
    
    if (!state.bridgeConnected || !isHealthy) {
      console.warn('ADK Bridge not connected or unhealthy, using mock execution');
      dispatch({ 
        type: 'SET_BRIDGE_STATUS', 
        payload: { connected: false, error: 'Bridge health check failed' } 
      });
      return runMockAgents();
    }

    // Test the API endpoint before running agents
    const apiTestPassed = await testBridgeAPI();
    if (!apiTestPassed) {
      console.warn('Bridge API test failed, using mock execution with bridge status');
      dispatch({ 
        type: 'SET_BRIDGE_STATUS', 
        payload: { connected: false, error: 'Bridge API endpoint not responding properly' } 
      });
      return runMockAgents();
    }

    const startTime = Date.now();
    
    try {
      console.log('🚀 Running agents via ADK Bridge...');
      
      // Call ADK bridge to run agents
      const feeds = state.selectedFeeds || ['Official'];
      const region = state.currentRegion || 'Miami, FL';
      
      console.log('📤 Sending request to bridge with region & feeds:', region, feeds);
      
      // Bridge expects multipart/form-data with feeds array (and region)
      const formData = new FormData();
      formData.append('region', region);
      feeds.forEach(feed => {
        formData.append('feeds', feed);
      });
      
      const response = await fetch(`${ADK_BRIDGE_URL}/api/run-agents`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bridge error response:', errorText);
        throw new Error(`Bridge error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Agents executed via ADK Bridge:', result);

      // If bridge returned real data, update state
      if (result?.data) {
        if (Array.isArray(result.data.shelters)) {
          dispatch({ type: 'UPDATE_DATA', payload: { type: 'shelters', data: result.data.shelters } });
        }
        if (Array.isArray(result.data.closures)) {
          dispatch({ type: 'UPDATE_DATA', payload: { type: 'closures', data: result.data.closures } });
        }
        if (Array.isArray(result.data.supplies)) {
          dispatch({ type: 'UPDATE_DATA', payload: { type: 'supplies', data: result.data.supplies } });
        }
        if (Array.isArray(result.data.alerts)) {
          dispatch({ type: 'UPDATE_DATA', payload: { type: 'alerts', data: result.data.alerts } });
        }
      }

      // Update agent statuses
      ['news', 'mapping', 'logistics'].forEach(agent => {
        dispatch({
          type: 'UPDATE_AGENT_STATUS',
          payload: {
            agent,
            updates: { status: 'done', progress: 100, lastRun: new Date().toISOString() },
          },
        });
      });

      // Add run to history
      const run = {
        id: `run_${Date.now()}`,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        agents: {
          news: { status: 'done', duration: 1200 },
          mapping: { status: 'done', duration: 900 },
          logistics: { status: 'done', duration: 1400 },
        },
        merge: { status: 'done', duration: 300 },
        source: 'ADK Bridge',
        region: result?.region || state.currentRegion || 'Unknown',
        feeds: result?.feeds || feeds,
      };
      
      dispatch({ type: 'ADD_RUN', payload: run });

    } catch (error) {
      console.error('❌ Error running agents via bridge:', error);
      
      // Update bridge status to disconnected
      dispatch({ 
        type: 'SET_BRIDGE_STATUS', 
        payload: { connected: false, error: error.message } 
      });
      
      // Fallback to mock execution
      runMockAgents();
    }
  };

  // Fallback mock agent execution
  const runMockAgents = () => {
    const startTime = Date.now();
    const isBridgeConnected = state.bridgeConnected;
    
    console.log(`🔄 Running agents in ${isBridgeConnected ? 'Bridge Fallback' : 'Mock'} mode...`);
    
    // Set all agents to running
    ['news', 'mapping', 'logistics'].forEach(agent => {
      dispatch({
        type: 'UPDATE_AGENT_STATUS',
        payload: {
          agent,
          updates: { status: 'running', progress: 0, lastRun: new Date().toISOString() },
        },
      });
    });

    // Simulate parallel execution
    const durations = [1200, 900, 1400];
    
    ['news', 'mapping', 'logistics'].forEach((agent, index) => {
      const duration = durations[index];
      
      // Animate progress
      const progressInterval = setInterval(() => {
        dispatch({
          type: 'UPDATE_AGENT_STATUS',
          payload: {
            agent,
            updates: { progress: Math.min(100, (Date.now() - startTime) / duration * 100) },
          },
        });
      }, 50);

      // Complete agent
      setTimeout(() => {
        clearInterval(progressInterval);
        dispatch({
          type: 'UPDATE_AGENT_STATUS',
          payload: {
            agent,
            updates: { status: 'done', progress: 100 },
          },
        });
      }, duration);
    });

    // Add run to history
    setTimeout(() => {
      const run = {
        id: `run_${Date.now()}`,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        agents: {
          news: { status: 'done', duration: 1200 },
          mapping: { status: 'done', duration: 900 },
          logistics: { status: 'done', duration: 1400 },
        },
        merge: { status: 'done', duration: 300 },
        source: isBridgeConnected ? 'Bridge Fallback' : 'Mock',
      };
      
      dispatch({ type: 'ADD_RUN', payload: run });
    }, 2000);
  };

  const value = {
    state,
    dispatch,
    runAllAgents,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
