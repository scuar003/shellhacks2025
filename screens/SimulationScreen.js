import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';

const { width, height } = Dimensions.get('window');

const SimulationScreen = () => {
  const { state, dispatch, runAllAgents } = useApp();
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [simulationData, setSimulationData] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const disasterScenarios = [
    {
      id: 'hurricane',
      title: 'Category 4 Hurricane',
      icon: 'thunderstorm',
      color: '#FF6B6B',
      description: 'Major hurricane approaching with 140+ mph winds',
      duration: '48 hours',
      severity: 'Critical',
      region: 'Miami, FL',
      feeds: ['Official', 'Social', 'Crowd'],
      steps: [
        {
          title: 'Hurricane Warning Issued',
          description: 'National Weather Service issues hurricane warning for Miami-Dade County',
          time: 'T-48 hours',
          agentData: {
            alerts: ['Hurricane Warning: Category 4 storm approaching', 'Mandatory evacuation ordered for Zone A'],
            shelters: ['Emergency shelters opening', 'Capacity: 15,000 people'],
            supplies: ['Emergency supplies being distributed', 'Water, food, medical supplies available'],
            closures: ['Highway 1 closed', 'Bridges closing at T-12 hours']
          }
        },
        {
          title: 'Evacuation Orders',
          description: 'Mandatory evacuation begins for coastal areas',
          time: 'T-24 hours',
          agentData: {
            alerts: ['Evacuation routes activated', 'Traffic management in effect'],
            shelters: ['All shelters at 60% capacity', 'Additional shelters opening'],
            supplies: ['Supply distribution points established', 'Fuel stations prioritized'],
            closures: ['Major highways converted to one-way', 'Toll roads free for evacuation']
          }
        },
        {
          title: 'Storm Landfall',
          description: 'Hurricane makes landfall with catastrophic winds',
          time: 'T-0 hours',
          agentData: {
            alerts: ['Storm surge warning: 15-20 feet', 'Power outages widespread'],
            shelters: ['Shelters at maximum capacity', 'Emergency medical teams deployed'],
            supplies: ['Emergency supplies running low', 'Rescue operations active'],
            closures: ['All roads impassable', 'Airports closed', 'Ports secured']
          }
        },
        {
          title: 'Recovery Phase',
          description: 'Initial damage assessment and rescue operations',
          time: 'T+12 hours',
          agentData: {
            alerts: ['Search and rescue operations active', 'Medical emergencies prioritized'],
            shelters: ['Damage assessment in progress', 'Temporary shelters being established'],
            supplies: ['Supply chains disrupted', 'Emergency aid being mobilized'],
            closures: ['Road clearance operations', 'Infrastructure damage assessment']
          }
        }
      ]
    },
    {
      id: 'earthquake',
      title: '7.2 Magnitude Earthquake',
      icon: 'pulse',
      color: '#8B4513',
      description: 'Major earthquake strikes with widespread damage',
      duration: '72 hours',
      severity: 'Critical',
      region: 'Los Angeles, CA',
      feeds: ['Official', 'Social', 'Crowd'],
      steps: [
        {
          title: 'Earthquake Strikes',
          description: '7.2 magnitude earthquake hits Los Angeles area',
          time: 'T-0 minutes',
          agentData: {
            alerts: ['Earthquake: 7.2 magnitude', 'Tsunami warning for coastal areas'],
            shelters: ['Emergency shelters activated', 'Stadiums and schools opening'],
            supplies: ['Emergency supplies being mobilized', 'Medical teams dispatched'],
            closures: ['Major freeways damaged', 'Bridges and overpasses unsafe']
          }
        },
        {
          title: 'Initial Response',
          description: 'First responders assess damage and begin rescue operations',
          time: 'T+30 minutes',
          agentData: {
            alerts: ['Aftershocks expected', 'Gas leaks reported throughout city'],
            shelters: ['Temporary shelters being established', 'Red Cross setting up aid stations'],
            supplies: ['Water distribution points activated', 'Medical supplies being delivered'],
            closures: ['Road damage assessment ongoing', 'Public transit suspended']
          }
        },
        {
          title: 'Search & Rescue',
          description: 'Intensive search and rescue operations underway',
          time: 'T+6 hours',
          agentData: {
            alerts: ['Search and rescue teams deployed', 'Medical triage centers established'],
            shelters: ['Shelters at capacity', 'Additional facilities being prepared'],
            supplies: ['Supply distribution networks established', 'Emergency food and water available'],
            closures: ['Road clearance operations', 'Infrastructure repair priorities set']
          }
        }
      ]
    },
    {
      id: 'flood',
      title: 'Flash Flood Emergency',
      icon: 'water',
      color: '#2196F3',
      description: 'Rapid flooding due to heavy rainfall and dam failure',
      duration: '24 hours',
      severity: 'High',
      region: 'Houston, TX',
      feeds: ['Official', 'Social', 'Crowd'],
      steps: [
        {
          title: 'Flood Warning',
          description: 'Flash flood warning issued due to heavy rainfall',
          time: 'T-6 hours',
          agentData: {
            alerts: ['Flash flood warning', 'Dam failure possible'],
            shelters: ['High ground shelters prepared', 'Evacuation centers ready'],
            supplies: ['Sandbags being distributed', 'Emergency supplies stockpiled'],
            closures: ['Low-lying roads closed', 'Flood barriers activated']
          }
        },
        {
          title: 'Evacuation Orders',
          description: 'Mandatory evacuation for flood-prone areas',
          time: 'T-2 hours',
          agentData: {
            alerts: ['Mandatory evacuation ordered', 'Water rescue teams on standby'],
            shelters: ['Evacuation centers opening', 'High-capacity shelters activated'],
            supplies: ['Emergency supplies being distributed', 'Boat rescue teams mobilized'],
            closures: ['Major highways flooded', 'Public transit suspended']
          }
        },
        {
          title: 'Rescue Operations',
          description: 'Water rescue operations and emergency response',
          time: 'T+2 hours',
          agentData: {
            alerts: ['Water rescue operations active', 'Medical emergencies being prioritized'],
            shelters: ['Shelters at maximum capacity', 'Temporary facilities being established'],
            supplies: ['Supply distribution by boat', 'Emergency medical supplies delivered'],
            closures: ['Most roads impassable', 'Infrastructure damage assessment']
          }
        }
      ]
    }
  ];

  // Pulse animation for simulation
  useEffect(() => {
    if (isSimulating) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSimulating]);

  const startSimulation = (scenario) => {
    setSelectedScenario(scenario);
    setIsSimulating(true);
    setSimulationStep(0);
    setSimulationData(scenario.steps[0]);
    
    // Set the region and feeds for the simulation
    dispatch({ type: 'SET_REGION', payload: scenario.region });
    dispatch({ type: 'SET_FEEDS', payload: scenario.feeds });
    
    // Start the simulation steps
    runSimulationSteps(scenario);
  };

  const runSimulationSteps = (scenario) => {
    let currentStep = 0;
    
    const stepInterval = setInterval(() => {
      if (currentStep < scenario.steps.length) {
        setSimulationStep(currentStep);
        setSimulationData(scenario.steps[currentStep]);
        
        // Update the app state with simulation data
        updateAppWithSimulationData(scenario.steps[currentStep]);
        
        currentStep++;
      } else {
        // Simulation complete
        clearInterval(stepInterval);
        setIsSimulating(false);
        Alert.alert(
          'Simulation Complete',
          `The ${scenario.title} simulation has finished. This demonstrates how our ADK agents provide critical real-time data during disaster response.`,
          [{ text: 'OK', onPress: () => resetSimulation() }]
        );
      }
    }, 8000); // 8 seconds per step
  };

  const updateAppWithSimulationData = (stepData) => {
    try {
      // Update alerts
      if (stepData.agentData && stepData.agentData.alerts && Array.isArray(stepData.agentData.alerts)) {
        const alertData = stepData.agentData.alerts.map((alert, index) => ({
          id: `sim_alert_${index}`,
          title: String(alert || 'Emergency Alert'),
          severity: 'high',
          time: new Date().toISOString(),
          lat: 25.7617 + (Math.random() - 0.5) * 0.1,
          lng: -80.1918 + (Math.random() - 0.5) * 0.1,
        }));
        dispatch({ type: 'UPDATE_DATA', payload: { type: 'alerts', data: alertData } });
      }

      // Update shelters
      if (stepData.agentData && stepData.agentData.shelters && Array.isArray(stepData.agentData.shelters)) {
        const shelterData = stepData.agentData.shelters.map((shelter, index) => ({
          id: `sim_shelter_${index}`,
          name: String(shelter || 'Emergency Shelter'),
          status: 'open',
          capacity: 100,
          occupied: Math.floor(Math.random() * 100),
          lat: 25.7617 + (Math.random() - 0.5) * 0.2,
          lng: -80.1918 + (Math.random() - 0.5) * 0.2,
          last_updated: new Date().toISOString(),
        }));
        dispatch({ type: 'UPDATE_DATA', payload: { type: 'shelters', data: shelterData } });
      }

      // Update supplies
      if (stepData.agentData && stepData.agentData.supplies && Array.isArray(stepData.agentData.supplies)) {
        const supplyData = stepData.agentData.supplies.map((supply, index) => ({
          id: `sim_supply_${index}`,
          site: String(supply || 'Supply Distribution Point'),
          items: ['Water', 'Food', 'Medical', 'Blankets'],
          stock_pct: Math.floor(Math.random() * 100),
          lat: 25.7617 + (Math.random() - 0.5) * 0.15,
          lng: -80.1918 + (Math.random() - 0.5) * 0.15,
          last_restocked: new Date().toISOString(),
        }));
        dispatch({ type: 'UPDATE_DATA', payload: { type: 'supplies', data: supplyData } });
      }

      // Update closures
      if (stepData.agentData && stepData.agentData.closures && Array.isArray(stepData.agentData.closures)) {
        const closureData = stepData.agentData.closures.map((closure, index) => ({
          id: `sim_closure_${index}`,
          road: String(closure || 'Road Closure'),
          cause: 'Emergency',
          eta: 'Unknown',
          lat: 25.7617 + (Math.random() - 0.5) * 0.1,
          lng: -80.1918 + (Math.random() - 0.5) * 0.1,
          updated: new Date().toISOString(),
        }));
        dispatch({ type: 'UPDATE_DATA', payload: { type: 'closures', data: closureData } });
      }
    } catch (error) {
      console.error('Error updating simulation data:', error);
    }
  };

  const resetSimulation = () => {
    setSelectedScenario(null);
    setIsSimulating(false);
    setSimulationStep(0);
    setSimulationData(null);
  };

  const renderScenarioCard = (scenario) => (
    <TouchableOpacity
      key={scenario.id}
      style={[
        styles.scenarioCard,
        { borderColor: scenario.color },
        selectedScenario?.id === scenario.id && styles.selectedCard
      ]}
      onPress={() => !isSimulating && startSimulation(scenario)}
      disabled={isSimulating}
    >
      <View style={styles.scenarioHeader}>
        <View style={[styles.scenarioIcon, { backgroundColor: scenario.color }]}>
          <Ionicons name={scenario.icon} size={24} color="white" />
        </View>
        <View style={styles.scenarioInfo}>
          <Text style={styles.scenarioTitle}>{scenario.title}</Text>
          <Text style={styles.scenarioDescription}>{scenario.description}</Text>
        </View>
        <View style={styles.scenarioMeta}>
          <Text style={[styles.severityBadge, { backgroundColor: scenario.color }]}>
            {scenario.severity}
          </Text>
          <Text style={styles.durationText}>{scenario.duration}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSimulationProgress = () => {
    if (!selectedScenario || !isSimulating) return null;

    return (
      <View style={styles.simulationContainer}>
        <View style={styles.simulationHeader}>
          <Animated.View style={[styles.simulationIcon, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="play" size={20} color="white" />
          </Animated.View>
          <Text style={styles.simulationTitle}>Simulation Running</Text>
          <TouchableOpacity onPress={resetSimulation} style={styles.stopButton}>
            <Ionicons name="stop" size={20} color={colors.red} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.stepTitle}>{simulationData?.title}</Text>
          <Text style={styles.stepDescription}>{simulationData?.description}</Text>
          <Text style={styles.stepTime}>{simulationData?.time}</Text>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${((simulationStep + 1) / selectedScenario.steps.length) * 100}%`,
                  backgroundColor: selectedScenario.color
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            Step {simulationStep + 1} of {selectedScenario.steps.length}
          </Text>
        </View>

        <View style={styles.agentDataContainer}>
          <Text style={styles.agentDataTitle}>Real-time Agent Data:</Text>
          {simulationData?.agentData && Object.entries(simulationData.agentData).map(([key, data]) => (
            <View key={key} style={styles.agentDataItem}>
              <Text style={styles.agentDataLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
              <Text style={styles.agentDataValue}>{Array.isArray(data) ? data.join(', ') : data}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Disaster Simulation</Text>
        <Text style={styles.subtitle}>
          Experience how ADK agents provide critical real-time data during disaster response scenarios
        </Text>
      </View>

      {!isSimulating ? (
        <View style={styles.scenariosContainer}>
          <Text style={styles.sectionTitle}>Select a Disaster Scenario</Text>
          {disasterScenarios.map(renderScenarioCard)}
        </View>
      ) : (
        renderSimulationProgress()
      )}

      <View style={styles.infoContainer}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.blue} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How It Works</Text>
            <Text style={styles.infoText}>
              Each simulation demonstrates how our ADK agents (News, Mapping, Logistics) 
              work together to provide real-time data during disasters. The agents fetch 
              live information about shelters, supplies, road conditions, and alerts to 
              help first responders and civilians make critical decisions.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  scenariosContainer: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  scenarioCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    ...shadows.medium,
  },
  selectedCard: {
    borderColor: colors.red,
    backgroundColor: colors.surface + '20',
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scenarioIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  scenarioInfo: {
    flex: 1,
  },
  scenarioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  scenarioDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  scenarioMeta: {
    alignItems: 'flex-end',
  },
  severityBadge: {
    color: 'white',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  durationText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  simulationContainer: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
  simulationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  simulationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.red,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  simulationTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  stopButton: {
    padding: spacing.sm,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  stepTime: {
    fontSize: 14,
    color: colors.red,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  agentDataContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  agentDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  agentDataItem: {
    marginBottom: spacing.sm,
  },
  agentDataLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  agentDataValue: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  infoContainer: {
    padding: spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.small,
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default SimulationScreen;
