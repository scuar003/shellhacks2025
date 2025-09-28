import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';
import KPICard from '../components/KPICard';
import AgentCard from '../components/AgentCard';

const DashboardScreen = ({ navigation }) => {
  const { state, dispatch, runAllAgents } = useApp();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [refreshing, setRefreshing] = React.useState(false);

  // Pulse animation for monitoring status
  useEffect(() => {
    if (state.isMonitoring) {
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
  }, [state.isMonitoring]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleRunNow = () => {
    runAllAgents();
  };

  const getKPIValues = () => {
    const activeShelters = state.shelters.filter(s => s.status === 'Open').length;
    const roadClosures = state.closures.length;
    const supplySites = state.supplies.length;
    const newAlerts = state.newAlertsCount;

    return {
      activeShelters,
      roadClosures,
      supplySites,
      newAlerts,
    };
  };

  const kpiValues = getKPIValues();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>
            {state.currentRegion || 'No region selected'}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <Animated.View
            style={[
              styles.statusDot,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
          <Text style={styles.statusText}>
            {state.isMonitoring ? 'Monitoring ON' : 'Monitoring OFF'}
          </Text>
        </View>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiSection}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.kpiGrid}>
          <KPICard
            title="Active Shelters"
            value={kpiValues.activeShelters}
            icon="home"
            color={colors.shelter}
          />
          <KPICard
            title="Road Closures"
            value={kpiValues.roadClosures}
            icon="warning"
            color={colors.closure}
          />
          <KPICard
            title="Supply Sites"
            value={kpiValues.supplySites}
            icon="cube"
            color={colors.supply}
          />
          <KPICard
            title="New Alerts"
            value={kpiValues.newAlerts}
            icon="notifications"
            color={colors.red}
            trend={kpiValues.newAlerts > 0 ? 15 : -5}
          />
        </View>
      </View>

      {/* Agent Status */}
      <View style={styles.agentsSection}>
        <View style={styles.agentsHeader}>
          <Text style={styles.sectionTitle}>Parallel Agents</Text>
          <TouchableOpacity style={styles.runButton} onPress={handleRunNow}>
            <Ionicons name="play" size={16} color={colors.textPrimary} />
            <Text style={styles.runButtonText}>Run Now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.agentsGrid}>
          <AgentCard
            agent="News"
            status={state.agents.news.status}
            progress={state.agents.news.progress}
            lastRun={state.agents.news.lastRun}
            a2aLabel="News → Coordinator"
          />
          <AgentCard
            agent="Mapping"
            status={state.agents.mapping.status}
            progress={state.agents.mapping.progress}
            lastRun={state.agents.mapping.lastRun}
            a2aLabel="Maps → Coordinator"
          />
          <AgentCard
            agent="Logistics"
            status={state.agents.logistics.status}
            progress={state.agents.logistics.progress}
            lastRun={state.agents.logistics.lastRun}
            a2aLabel="Logistics → Coordinator"
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Map')}
          >
            <Ionicons name="map" size={24} color={colors.red} />
            <Text style={styles.actionText}>View Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Alerts')}
          >
            <Ionicons name="notifications" size={24} color={colors.orange} />
            <Text style={styles.actionText}>View Alerts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Runs')}
          >
            <Ionicons name="list" size={24} color={colors.yellow} />
            <Text style={styles.actionText}>Agent Runs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Wizard', { screen: 'StepRegion' })}
          >
            <Ionicons name="settings" size={24} color={colors.textSecondary} />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <Ionicons name="flash" size={16} color={colors.orange} />
            <Text style={styles.activityText}>
              {state.isMonitoring ? 'Monitoring active' : 'Monitoring paused'}
            </Text>
            <Text style={styles.activityTime}>Now</Text>
          </View>
          <View style={styles.activityItem}>
            <Ionicons name="people" size={16} color={colors.yellow} />
            <Text style={styles.activityText}>
              {state.runs.length} agent runs completed
            </Text>
            <Text style={styles.activityTime}>
              {state.runs.length > 0 ? '2m ago' : 'Never'}
            </Text>
          </View>
          <View style={styles.activityItem}>
            <Ionicons name="notifications" size={16} color={colors.red} />
            <Text style={styles.activityText}>
              {state.alerts.length} total alerts
            </Text>
            <Text style={styles.activityTime}>Live</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.small,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  kpiSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  agentsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  agentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.red,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.small,
  },
  runButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  agentsGrid: {
    gap: spacing.md,
  },
  actionsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 80,
    ...shadows.small,
  },
  actionText: {
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  activitySection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.small,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  activityTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
});

export default DashboardScreen;
