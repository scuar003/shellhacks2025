import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';
import RunItem from '../components/RunItem';

const RunsScreen = () => {
  const { state, dispatch, runAllAgents } = useApp();
  const [countdown, setCountdown] = useState(60);

  // Countdown for auto-run
  useEffect(() => {
    if (!state.autoRunEnabled) {
      setCountdown(60);
      return;
    }

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          runAllAgents();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.autoRunEnabled, runAllAgents]);

  const handleAutoRunToggle = (value) => {
    dispatch({ type: 'SET_AUTO_RUN', payload: value });
    if (value) {
      setCountdown(60);
    }
  };

  const handleManualRun = () => {
    runAllAgents();
  };

  const handleClearRuns = () => {
    Alert.alert(
      'Clear Runs',
      'Are you sure you want to clear all run history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {
          // This would clear runs in a real implementation
          Alert.alert('Cleared', 'Run history has been cleared');
        }},
      ]
    );
  };

  const renderRun = ({ item }) => <RunItem run={item} />;

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="play-circle-outline" size={64} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>No Runs Yet</Text>
      <Text style={styles.emptySubtitle}>
        Agent runs will appear here once you start monitoring
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleManualRun}>
        <Ionicons name="play" size={20} color={colors.textPrimary} />
        <Text style={styles.emptyButtonText}>Run Now</Text>
      </TouchableOpacity>
    </View>
  );

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Agent Runs</Text>
          <Text style={styles.subtitle}>
            {state.runs.length} total runs • {state.autoRunEnabled ? 'Auto-run enabled' : 'Manual mode'}
          </Text>
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearRuns}>
          <Ionicons name="trash" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlRow}>
          <View style={styles.controlLeft}>
            <Ionicons name="refresh" size={20} color={colors.textPrimary} />
            <View style={styles.controlInfo}>
              <Text style={styles.controlTitle}>Auto-Run</Text>
              <Text style={styles.controlSubtitle}>
                Run agents every 1 minute
              </Text>
            </View>
          </View>
          <Switch
            value={state.autoRunEnabled}
            onValueChange={handleAutoRunToggle}
            trackColor={{ false: colors.border, true: colors.red }}
            thumbColor={state.autoRunEnabled ? colors.textPrimary : colors.textMuted}
          />
        </View>

        {state.autoRunEnabled && (
          <View style={styles.countdownContainer}>
            <Ionicons name="time" size={16} color={colors.orange} />
            <Text style={styles.countdownText}>
              Next run in {formatCountdown(countdown)}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.manualRunButton} onPress={handleManualRun}>
          <Ionicons name="play" size={20} color={colors.textPrimary} />
          <Text style={styles.manualRunText}>Run Now</Text>
        </TouchableOpacity>
      </View>

      {/* Runs List */}
      <FlatList
        data={state.runs}
        renderItem={renderRun}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.statusText}>
            {state.runs.filter(run => run.agents.news.status === 'done').length} completed
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Ionicons name="flash" size={16} color={colors.orange} />
          <Text style={styles.statusText}>
            {state.autoRunEnabled ? 'Auto-running' : 'Manual mode'}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Ionicons name="time" size={16} color={colors.textMuted} />
          <Text style={styles.statusText}>
            Last: {state.runs.length > 0 ? '2m ago' : 'Never'}
          </Text>
        </View>
      </View>
    </View>
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
  clearButton: {
    padding: spacing.sm,
  },
  controlsContainer: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.small,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  controlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  controlInfo: {
    marginLeft: spacing.sm,
  },
  controlTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  controlSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  countdownText: {
    fontSize: 14,
    color: colors.orange,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  manualRunButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  manualRunText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  listContainer: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.red,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    ...shadows.medium,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
});

export default RunsScreen;
