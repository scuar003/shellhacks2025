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
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.small,
  },
  chipActive: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  chipTextActive: {
    color: colors.textPrimary,
  },
});

export default LayerChips;
