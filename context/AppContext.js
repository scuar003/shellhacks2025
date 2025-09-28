import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { colors } from '../theme/colors';

// Mock data imports
import sheltersData from '../assets/mock/shelters.json';
import closuresData from '../assets/mock/closures.json';
import suppliesData from '../assets/mock/supplies.json';
import alertsData from '../assets/mock/alerts.json';

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
  shelters: sheltersData,
  closures: closuresData,
  supplies: suppliesData,
  alerts: alertsData,
  
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
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'INITIALIZE_APP':
      return { ...state, isInitialized: true };
      
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
        runs: [action.payload, ...state.runs.slice(0, 9)], // Keep last 10 runs
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

  // Initialize app
  useEffect(() => {
    dispatch({ type: 'INITIALIZE_APP' });
  }, []);

  // Auto-update data every 20 seconds
  useEffect(() => {
    if (!state.isMonitoring) return;

    const interval = setInterval(() => {
      // Simulate data updates
      const newAlert = {
        id: `al_${Date.now()}`,
        severity: ['Critical', 'High', 'Moderate'][Math.floor(Math.random() * 3)],
        title: `New alert: ${['Road closure', 'Shelter update', 'Supply delivery', 'Weather warning'][Math.floor(Math.random() * 4)]}`,
        source: ['Official', 'Social', 'Crowd'][Math.floor(Math.random() * 3)],
        time: new Date().toISOString(),
      };
      
      dispatch({ type: 'ADD_ALERT', payload: newAlert });
      
      // Simulate KPI updates
      const updatedShelters = state.shelters.map(shelter => ({
        ...shelter,
        occupied: Math.min(shelter.capacity, shelter.occupied + Math.floor(Math.random() * 10 - 5)),
        updated: new Date().toISOString(),
      }));
      
      dispatch({ type: 'UPDATE_KPIS', payload: { shelters: updatedShelters } });
    }, 20000);

    return () => clearInterval(interval);
  }, [state.isMonitoring, state.shelters]);

  // Auto-run every minute if enabled
  useEffect(() => {
    if (!state.autoRunEnabled) return;

    const interval = setInterval(() => {
      runAllAgents();
    }, 60000);

    return () => clearInterval(interval);
  }, [state.autoRunEnabled]);

  const runAllAgents = () => {
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

    // Simulate parallel execution with different durations
    const durations = [1200, 900, 1400]; // Different durations for each agent
    
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
