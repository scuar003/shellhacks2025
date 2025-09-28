import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';

const AlertCard = ({ alert, onPress }) => {
  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical': return colors.critical;
      case 'high': return colors.high;
      case 'moderate': return colors.moderate;
      default: return colors.textMuted;
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'alert-circle';
      case 'high': return 'warning';
      case 'moderate': return 'information-circle';
      default: return 'help-circle';
    }
  };

  const getSourceColor = (source) => {
    switch (source.toLowerCase()) {
      case 'official': return colors.red;
      case 'social': return colors.orange;
      case 'crowd': return colors.yellow;
      default: return colors.textMuted;
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now - alertTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.severityContainer}>
          <View
            style={[
              styles.severityChip,
              { backgroundColor: getSeverityColor(alert.severity) },
            ]}
          >
            <Ionicons
              name={getSeverityIcon(alert.severity)}
              size={12}
              color={colors.textPrimary}
            />
            <Text style={styles.severityText}>{alert.severity.toUpperCase()}</Text>
          </View>
          <Text style={styles.timestamp}>{formatTime(alert.time)}</Text>
        </View>
        <View
          style={[
            styles.sourceChip,
            { backgroundColor: getSourceColor(alert.source) },
          ]}
        >
          <Text style={styles.sourceText}>{alert.source}</Text>
        </View>
      </View>

      <Text style={styles.title}>{alert.title}</Text>

      <View style={styles.footer}>
        <View style={styles.timeContainer}>
          <Ionicons name="time" size={14} color={colors.textMuted} />
          <Text style={styles.timeText}>
            {new Date(alert.time).toLocaleString()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  severityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textMuted,
  },
  sourceChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
});

export default AlertCard;
