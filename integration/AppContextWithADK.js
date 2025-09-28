// Modified AppContext.js with Google ADK integration
// Replace your existing AppContext.js with this version

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { colors } from '../theme/colors';
import ADKAgentManager from './ADKIntegration';

// Your Google ADK API Key
const GOOGLE_ADK_API_KEY = 'YOUR_GOOGLE_ADK_API_KEY_HERE';

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

  // ADK Integration
  adkManager: null,
  isADKInitialized: false,
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'INITIALIZE_APP':
      return { ...state, isInitialized: true };
      
    case 'INITIALIZE_ADK':
      return { 
        ...state, 
        adkManager: action.payload.manager,
        isADKInitialized: action.payload.success 
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

  // Initialize app and ADK
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize ADK Manager
        const adkManager = new ADKAgentManager(GOOGLE_ADK_API_KEY);
        
        dispatch({ 
          type: 'INITIALIZE_ADK', 
          payload: { manager: adkManager, success: true } 
        });
        
        dispatch({ type: 'INITIALIZE_APP' });
      } catch (error) {
        console.error('Failed to initialize ADK:', error);
        dispatch({ 
          type: 'INITIALIZE_ADK', 
          payload: { manager: null, success: false } 
        });
        dispatch({ type: 'INITIALIZE_APP' });
      }
    };

    initializeApp();
  }, []);

  // Initialize agents when region and feeds are set
  useEffect(() => {
    if (state.adkManager && state.currentRegion && state.selectedFeeds) {
      initializeAgents();
    }
  }, [state.currentRegion, state.selectedFeeds, state.adkManager]);

  const initializeAgents = async () => {
    if (!state.adkManager) return;
    
    try {
      const result = await state.adkManager.initializeAgents(
        state.currentRegion, 
        state.selectedFeeds
      );
      
      if (result.success) {
        console.log('ADK Agents initialized successfully');
      } else {
        console.error('Failed to initialize ADK agents:', result.error);
      }
    } catch (error) {
      console.error('Error initializing agents:', error);
    }
  };

  // Real-time data updates with ADK
  useEffect(() => {
    if (!state.isMonitoring || !state.adkManager) return;

    const updateData = async () => {
      try {
        // Fetch real-time data from your APIs
        const realTimeData = await state.adkManager.fetchRealTimeData();
        
        if (realTimeData) {
          // Update data in state
          Object.entries(realTimeData).forEach(([key, value]) => {
            dispatch({ type: 'UPDATE_DATA', payload: { type: key, data: value } });
          });
        }
      } catch (error) {
        console.error('Error updating real-time data:', error);
      }
    };

    const interval = setInterval(updateData, 20000); // Every 20 seconds
    return () => clearInterval(interval);
  }, [state.isMonitoring, state.adkManager]);

  // Auto-run with ADK agents
  useEffect(() => {
    if (!state.autoRunEnabled || !state.adkManager) return;

    const interval = setInterval(() => {
      runAllAgents();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [state.autoRunEnabled, state.adkManager]);

  // Main function to run all agents with ADK
  const runAllAgents = async () => {
    if (!state.adkManager) {
      console.error('ADK Manager not initialized');
      return;
    }

    const startTime = Date.now();
    
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

    try {
      // Run agents in parallel with ADK
      const [newsResult, mappingResult, logisticsResult] = await Promise.all([
        runNewsAgent(),
        runMappingAgent(),
        runLogisticsAgent()
      ]);

      // Run coordinator with A2A handoffs
      const coordinatorResult = await runCoordinator(
        newsResult.data,
        mappingResult.data,
        logisticsResult.data
      );

      // Update agent statuses
      ['news', 'mapping', 'logistics'].forEach(agent => {
        dispatch({
          type: 'UPDATE_AGENT_STATUS',
          payload: {
            agent,
            updates: { status: 'done', progress: 100 },
          },
        });
      });

      // Add run to history
      const run = {
        id: `run_${Date.now()}`,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        agents: {
          news: { status: 'done', duration: newsResult.duration || 0 },
          mapping: { status: 'done', duration: mappingResult.duration || 0 },
          logistics: { status: 'done', duration: logisticsResult.duration || 0 },
        },
        merge: { status: 'done', duration: coordinatorResult.duration || 0 },
        coordinatorData: coordinatorResult.data,
      };
      
      dispatch({ type: 'ADD_RUN', payload: run });

    } catch (error) {
      console.error('Error running agents:', error);
      
      // Set agents to error state
      ['news', 'mapping', 'logistics'].forEach(agent => {
        dispatch({
          type: 'UPDATE_AGENT_STATUS',
          payload: {
            agent,
            updates: { status: 'error', progress: 0 },
          },
        });
      });
    }
  };

  // Individual agent functions
  const runNewsAgent = async () => {
    const startTime = Date.now();
    const result = await state.adkManager.runNewsAgent();
    const duration = Date.now() - startTime;
    
    return { ...result, duration };
  };

  const runMappingAgent = async () => {
    const startTime = Date.now();
    const result = await state.adkManager.runMappingAgent();
    const duration = Date.now() - startTime;
    
    return { ...result, duration };
  };

  const runLogisticsAgent = async () => {
    const startTime = Date.now();
    const result = await state.adkManager.runLogisticsAgent();
    const duration = Date.now() - startTime;
    
    return { ...result, duration };
  };

  const runCoordinator = async (newsData, mappingData, logisticsData) => {
    const startTime = Date.now();
    const result = await state.adkManager.runCoordinator(newsData, mappingData, logisticsData);
    const duration = Date.now() - startTime;
    
    return { ...result, duration };
  };

  const value = {
    state,
    dispatch,
    runAllAgents,
    initializeAgents,
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
