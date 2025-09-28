import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';
import AlertCard from '../components/AlertCard';

const AlertsScreen = () => {
  const { state, dispatch } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, critical, high, moderate
  const [showNewAlertsToast, setShowNewAlertsToast] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Show toast when new alerts arrive
  useEffect(() => {
    if (state.newAlertsCount > 0) {
      setShowNewAlertsToast(true);
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowNewAlertsToast(false);
          dispatch({ type: 'CLEAR_NEW_ALERTS' });
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [state.newAlertsCount]);

  const onRefresh = () => {
    setRefreshing(true);
    
    // Simulate adding new alerts
    const newAlert = {
      id: `al_${Date.now()}`,
      severity: ['Critical', 'High', 'Moderate'][Math.floor(Math.random() * 3)],
      title: `New alert: ${['Road closure', 'Shelter update', 'Supply delivery', 'Weather warning'][Math.floor(Math.random() * 4)]}`,
      source: ['Official', 'Social', 'Crowd'][Math.floor(Math.random() * 3)],
      time: new Date().toISOString(),
    };
    
    dispatch({ type: 'ADD_ALERT', payload: newAlert });
    
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getFilteredAlerts = () => {
    if (filter === 'all') return state.alerts;
    return state.alerts.filter(alert => alert.severity.toLowerCase() === filter);
  };

  const getFilterCount = (severity) => {
    if (severity === 'all') return state.alerts.length;
    return state.alerts.filter(alert => alert.severity.toLowerCase() === severity).length;
  };

  const handleAlertPress = (alert) => {
    Alert.alert(
      alert.title,
      `Severity: ${alert.severity}\nSource: ${alert.source}\nTime: ${new Date(alert.time).toLocaleString()}`,
      [{ text: 'OK' }]
    );
  };

  const renderAlert = ({ item }) => (
    <AlertCard alert={item} onPress={() => handleAlertPress(item)} />
  );

  const renderFilterChip = (severity, label) => {
    const isActive = filter === severity;
    const count = getFilterCount(severity);
    
    return (
      <TouchableOpacity
        style={[
          styles.filterChip,
          isActive && styles.filterChipActive,
        ]}
        onPress={() => setFilter(severity)}
      >
        <Text
          style={[
            styles.filterChipText,
            isActive && styles.filterChipTextActive,
          ]}
        >
          {label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off" size={64} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>No Alerts</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all' 
          ? 'No alerts available at the moment'
          : `No ${filter} alerts available`
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alerts</Text>
          <Text style={styles.subtitle}>
            {state.alerts.length} total alerts • {state.newAlertsCount} new
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <Ionicons name="flash" size={16} color={colors.orange} />
          <Text style={styles.statusText}>Live</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filters}>
            {renderFilterChip('all', 'All')}
            {renderFilterChip('critical', 'Critical')}
            {renderFilterChip('high', 'High')}
            {renderFilterChip('moderate', 'Moderate')}
          </View>
        </ScrollView>
      </View>

      {/* Alerts List */}
      <FlatList
        data={getFilteredAlerts()}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* New Alerts Toast */}
      {showNewAlertsToast && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="notifications" size={20} color={colors.textPrimary} />
          <Text style={styles.toastText}>
            {state.newAlertsCount} new alert{state.newAlertsCount > 1 ? 's' : ''} received
          </Text>
        </Animated.View>
      )}
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.small,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  filtersContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.small,
  },
  filterChipActive: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textPrimary,
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
  },
  toast: {
    position: 'absolute',
    top: 100,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.red,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.large,
  },
  toastText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
});

export default AlertsScreen;
