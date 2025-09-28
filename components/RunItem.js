import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';

const RunItem = ({ run }) => {
  const [expanded, setExpanded] = useState(false);

  const formatDuration = (ms) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const runTime = new Date(timestamp);
    const diffMs = now - runTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return colors.success;
      case 'running': return colors.running;
      case 'error': return colors.error;
      default: return colors.idle;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done': return 'checkmark-circle';
      case 'running': return 'play-circle';
      case 'error': return 'close-circle';
      default: return 'pause-circle';
    }
  };

  const renderAgentStep = (agentName, agentData) => (
    <View key={agentName} style={styles.agentStep}>
      <View style={styles.agentStepHeader}>
        <View style={styles.agentStepInfo}>
          <Ionicons name="robot" size={16} color={colors.orange} />
          <Text style={styles.agentStepName}>{agentName} Agent</Text>
        </View>
        <View style={styles.agentStepStatus}>
          <Ionicons
            name={getStatusIcon(agentData.status)}
            size={16}
            color={getStatusColor(agentData.status)}
          />
          <Text style={[styles.agentStepStatusText, { color: getStatusColor(agentData.status) }]}>
            {agentData.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.agentStepDetails}>
        <Text style={styles.agentStepDuration}>
          Duration: {formatDuration(agentData.duration)}
        </Text>
        <View style={styles.a2aChip}>
          <Text style={styles.a2aText}>{agentName} → Coordinator</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="play-circle" size={20} color={colors.red} />
          <View style={styles.headerInfo}>
            <Text style={styles.runId}>Run #{run.id.split('_')[1]}</Text>
            <Text style={styles.runTime}>{formatTime(run.timestamp)}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.totalDuration}>{formatDuration(run.duration)}</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textMuted}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          {/* Agent Steps */}
          <View style={styles.agentsSection}>
            <Text style={styles.sectionTitle}>Agent Execution</Text>
            {Object.entries(run.agents).map(([agentName, agentData]) =>
              renderAgentStep(agentName, agentData)
            )}
          </View>

          {/* Merge Step */}
          <View style={styles.mergeSection}>
            <Text style={styles.sectionTitle}>Result Merging</Text>
            <View style={styles.mergeStep}>
              <View style={styles.mergeStepHeader}>
                <View style={styles.mergeStepInfo}>
                  <Ionicons name="git-merge" size={16} color={colors.merging} />
                  <Text style={styles.mergeStepName}>Merge Results</Text>
                </View>
                <View style={styles.mergeStepStatus}>
                  <Ionicons
                    name={getStatusIcon(run.merge.status)}
                    size={16}
                    color={getStatusColor(run.merge.status)}
                  />
                  <Text style={[styles.mergeStepStatusText, { color: getStatusColor(run.merge.status) }]}>
                    {run.merge.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.mergeStepDuration}>
                Duration: {formatDuration(run.merge.duration)}
              </Text>
            </View>
          </View>

          {/* Summary */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Total Duration</Text>
                <Text style={styles.summaryStatValue}>{formatDuration(run.duration)}</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Agents</Text>
                <Text style={styles.summaryStatValue}>3</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Status</Text>
                <Text style={[styles.summaryStatValue, { color: colors.success }]}>Completed</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerInfo: {
    marginLeft: spacing.sm,
  },
  runId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  runTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  expandedContent: {
    padding: spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  agentsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  agentStep: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  agentStepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  agentStepInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentStepName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.xs,
    textTransform: 'capitalize',
  },
  agentStepStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentStepStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  agentStepDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agentStepDuration: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  a2aChip: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  a2aText: {
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  mergeSection: {
    marginBottom: spacing.lg,
  },
  mergeStep: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  mergeStepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  mergeStepInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mergeStepName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  mergeStepStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mergeStepStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  mergeStepDuration: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summarySection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  summaryStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
});

export default RunItem;
