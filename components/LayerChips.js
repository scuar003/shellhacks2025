import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';

const LayerChips = ({ layers, onToggleLayer }) => {
  const layerConfig = {
    shelters: {
      label: 'Shelters',
      icon: 'home',
      color: colors.shelter,
    },
    closures: {
      label: 'Road Closures',
      icon: 'warning',
      color: colors.closure,
    },
    supplies: {
      label: 'Supplies',
      icon: 'cube',
      color: colors.supply,
    },
    infrastructure: {
      label: 'Infrastructure',
      icon: 'construct',
      color: '#8B4513', // Brown
    },
    alerts: {
      label: 'Alerts',
      icon: 'alert-circle',
      color: '#FF6B6B', // Red
    },
    evacuation_routes: {
      label: 'Evacuation Routes',
      icon: 'arrow-forward',
      color: '#FFD93D', // Yellow
    },
    safe_routes: {
      label: 'Safe Routes',
      icon: 'checkmark-circle',
      color: '#4ECDC4', // Teal
    },
    hospitals: {
      label: 'Hospitals',
      icon: 'medical',
      color: '#FF8A80', // Light Red
    },
    emergency_services: {
      label: 'Emergency Services',
      icon: 'call',
      color: '#FF5722', // Deep Orange
    },
    weather_stations: {
      label: 'Weather Stations',
      icon: 'partly-sunny',
      color: '#2196F3', // Blue
    },
  };

  return (
    <View style={styles.container}>
      {Object.entries(layers).map(([key, isActive]) => {
        const config = layerConfig[key];
        if (!config) return null;

        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.chip,
              isActive && styles.chipActive,
              { borderColor: config.color },
            ]}
            onPress={() => onToggleLayer(key)}
          >
            <Ionicons
              name={config.icon}
              size={16}
              color={isActive ? colors.textPrimary : config.color}
            />
            <Text
              style={[
                styles.chipText,
                isActive && styles.chipTextActive,
                { color: isActive ? colors.textPrimary : config.color },
              ]}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    ...shadows.small,
    marginBottom: spacing.xs,
  },
  chipActive: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  chipTextActive: {
    color: colors.textPrimary,
  },
});

export default LayerChips;
