import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

const BridgeStatus = ({ bridgeConnected, bridgeError, onRetry }) => {
  const getStatusColor = () => {
    if (bridgeConnected) return colors.success || '#4CAF50';
    if (bridgeError) return colors.error || '#F44336';
    return colors.warning || '#FF9800';
  };

  const getStatusText = () => {
    if (bridgeConnected) return 'ADK Bridge Connected';
    if (bridgeError) return 'Bridge Disconnected';
    return 'Connecting...';
  };

  const getStatusIcon = () => {
    if (bridgeConnected) return '✅';
    if (bridgeError) return '❌';
    return '🔄';
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { borderColor: getStatusColor() }]}
      onPress={onRetry}
      disabled={bridgeConnected}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{getStatusIcon()}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          {bridgeError && (
            <Text style={styles.errorText}>
              {bridgeError}
            </Text>
          )}
        </View>
        {!bridgeConnected && (
          <Text style={styles.retryText}>Tap to retry</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface || '#1A1A1B',
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text || '#F5F5F5',
  },
  errorText: {
    fontSize: 12,
    color: colors.textSecondary || '#9E9E9E',
    marginTop: 2,
  },
  retryText: {
    fontSize: 12,
    color: colors.accent || '#FB8C00',
    fontStyle: 'italic',
  },
});

export default BridgeStatus;
