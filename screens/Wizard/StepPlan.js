import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

const StepPlan = ({ navigation }) => {
  const { state, dispatch } = useApp();
  const [isDeploying, setIsDeploying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const confettiAnim = new Animated.Value(0);

  const agentPlan = {
    coordinator: {
      name: 'Disaster Relief Coordinator',
      description: 'Main orchestrator that coordinates all sub-agents and manages the overall response',
      capabilities: ['Real-time monitoring', 'Resource allocation', 'Decision making', 'A2A coordination'],
    },
    subAgents: [
      {
        name: 'News Agent',
        description: 'Monitors official feeds, social media, and news sources for disaster-related information',
        capabilities: ['Official feeds monitoring', 'Social media analysis', 'News aggregation'],
        a2a: 'News → Coordinator',
      },
      {
        name: 'Mapping Agent',
        description: 'Processes geographical data, updates maps, and tracks infrastructure status',
        capabilities: ['GIS data processing', 'Map updates', 'Infrastructure monitoring'],
        a2a: 'Maps → Coordinator',
      },
      {
        name: 'Logistics Agent',
        description: 'Manages supply chains, resource distribution, and operational logistics',
        capabilities: ['Supply tracking', 'Resource allocation', 'Distribution planning'],
        a2a: 'Logistics → Coordinator',
      },
    ],
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    
    // Simulate deployment process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Show confetti animation
    Animated.timing(confettiAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    setShowSuccess(true);
    setIsDeploying(false);

    // Start monitoring
    dispatch({ type: 'SET_MONITORING', payload: true });

    // Navigate to dashboard after delay
    setTimeout(() => {
      navigation.navigate('Main');
    }, 3000);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderAgentCard = (agent, isSubAgent = false) => (
    <View key={agent.name} style={[styles.agentCard, isSubAgent && styles.subAgentCard]}>
      <View style={styles.agentHeader}>
        <Ionicons 
          name={isSubAgent ? "robot" : "shield-checkmark"} 
          size={20} 
          color={isSubAgent ? colors.orange : colors.red} 
        />
        <Text style={styles.agentName}>{agent.name}</Text>
        {isSubAgent && (
          <View style={styles.a2aChip}>
            <Text style={styles.a2aText}>{agent.a2a}</Text>
          </View>
        )}
      </View>
      <Text style={styles.agentDescription}>{agent.description}</Text>
      <View style={styles.capabilitiesContainer}>
        {agent.capabilities.map((capability, index) => (
          <View key={index} style={styles.capabilityChip}>
            <Text style={styles.capabilityText}>{capability}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <Animated.View
          style={[
            styles.confetti,
            {
              opacity: confettiAnim,
              transform: [
                {
                  scale: confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1.2],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={120} color={colors.success} />
        </Animated.View>
        
        <Text style={styles.successTitle}>Agent Deployed!</Text>
        <Text style={styles.successSubtitle}>
          Your Disaster Relief Coordinator is now active in {state.currentRegion}
        </Text>
        
        <View style={styles.successDetails}>
          <View style={styles.successDetail}>
            <Ionicons name="flash" size={20} color={colors.orange} />
            <Text style={styles.successDetailText}>Real-time monitoring enabled</Text>
          </View>
          <View style={styles.successDetail}>
            <Ionicons name="people" size={20} color={colors.yellow} />
            <Text style={styles.successDetailText}>3 sub-agents initialized</Text>
          </View>
          <View style={styles.successDetail}>
            <Ionicons name="map" size={20} color={colors.red} />
            <Text style={styles.successDetailText}>Live data feeds connected</Text>
          </View>
        </View>
        
        <Text style={styles.redirectText}>Redirecting to Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Deploy Agent</Text>
          <Text style={styles.subtitle}>
            Review your Disaster Relief Coordinator configuration
          </Text>
        </View>

        {/* Region Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="location" size={20} color={colors.red} />
            <Text style={styles.summaryTitle}>Deployment Region</Text>
          </View>
          <Text style={styles.summaryValue}>{state.currentRegion}</Text>
        </View>

        {/* Data Feeds Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="analytics" size={20} color={colors.orange} />
            <Text style={styles.summaryTitle}>Data Feeds</Text>
          </View>
          <View style={styles.feedsList}>
            {state.selectedFeeds.map((feed, index) => (
              <Text key={index} style={styles.feedItem}>• {feed} Feeds</Text>
            ))}
          </View>
        </View>

        {/* Agent Plan */}
        <View style={styles.planContainer}>
          <Text style={styles.planTitle}>Agent Configuration</Text>
          
          {/* Main Coordinator */}
          {renderAgentCard(agentPlan.coordinator)}
          
          {/* Sub Agents */}
          <Text style={styles.subAgentsTitle}>Sub-Agents</Text>
          {agentPlan.subAgents.map(agent => renderAgentCard(agent, true))}
        </View>

        {/* Deployment Info */}
        <View style={styles.deploymentInfo}>
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={styles.deploymentInfoText}>
            The agent will start monitoring immediately after deployment and begin coordinating disaster response activities.
          </Text>
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deployButton, isDeploying && styles.deployButtonDisabled]}
            onPress={handleDeploy}
            disabled={isDeploying}
          >
            {isDeploying ? (
              <>
                <Ionicons name="hourglass" size={20} color={colors.textPrimary} />
                <Text style={styles.deployButtonText}>Deploying...</Text>
              </>
            ) : (
              <>
                <Text style={styles.deployButtonText}>Deploy Agent</Text>
                <Ionicons name="rocket" size={20} color={colors.textPrimary} />
              </>
            )}
          </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
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
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  summaryValue: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  feedsList: {
    marginTop: spacing.sm,
  },
  feedItem: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  planContainer: {
    marginBottom: spacing.xl,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  agentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  subAgentCard: {
    marginLeft: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.orange,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  agentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  a2aChip: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  a2aText: {
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  agentDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  capabilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  capabilityChip: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  capabilityText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  subAgentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  deploymentInfo: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  deploymentInfoText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  deployButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.red,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    ...shadows.medium,
  },
  deployButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  deployButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginHorizontal: spacing.sm,
  },
  successContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  confetti: {
    marginBottom: spacing.xl,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 24,
  },
  successDetails: {
    marginBottom: spacing.xl,
  },
  successDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  successDetailText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  redirectText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});

export default StepPlan;
