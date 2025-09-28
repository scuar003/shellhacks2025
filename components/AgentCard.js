import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';

const AgentCard = ({ agent, status, progress, lastRun, a2aLabel }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'running') {
      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: progress / 100,
        duration: 200,
        useNativeDriver: false,
      }).start();

      // Pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    } else {
      progressAnim.setValue(progress / 100);
      pulseAnim.setValue(1);
    }
  }, [status, progress]);

  const getStatusColor = () => {
    switch (status) {
      case 'idle': return colors.idle;
      case 'running': return colors.running;
      case 'merging': return colors.merging;
      case 'done': return colors.done;
      default: return colors.idle;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'idle': return 'pause-circle';
      case 'running': return 'play-circle';
      case 'merging': return 'sync';
      case 'done': return 'checkmark-circle';
      default: return 'pause-circle';
    }
  };

  const formatLastRun = (timestamp) => {
    if (!timestamp) return 'Never';
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

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="robot" size={16} color={colors.textPrimary} />
          <Text style={styles.title}>{agent}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: getStatusColor() }]}>
          <Ionicons name={getStatusIcon()} size={12} color={colors.textPrimary} />
          <Text style={styles.statusText}>{status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: getStatusColor(),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.lastRun}>Last run: {formatLastRun(lastRun)}</Text>
        {a2aLabel && (
          <View style={styles.a2aChip}>
            <Text style={styles.a2aText}>{a2aLabel}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: spacing.xs,
    textTransform: 'capitalize',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    minWidth: 30,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastRun: {
    fontSize: 12,
    color: colors.textSecondary,
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
    fontWeight: '600',
  },
});

export default AgentCard;
