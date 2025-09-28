import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

const feedOptions = [
  {
    id: 'Official',
    title: 'Official Feeds',
    description: 'Government agencies, emergency services, and official sources',
    icon: 'shield-checkmark',
    color: colors.red,
  },
  {
    id: 'Social',
    title: 'Social Reports',
    description: 'Social media monitoring and crowd-sourced reports',
    icon: 'people',
    color: colors.orange,
  },
  {
    id: 'Crowd',
    title: 'Crowdsourced Tips',
    description: 'Community reports and citizen-generated data',
    icon: 'megaphone',
    color: colors.yellow,
  },
];

const StepFeeds = ({ navigation }) => {
  const { state, dispatch } = useApp();
  const [selectedFeeds, setSelectedFeeds] = useState(state.selectedFeeds || ['Official']);

  const toggleFeed = (feedId) => {
    setSelectedFeeds(prev => {
      if (prev.includes(feedId)) {
        return prev.filter(id => id !== feedId);
      } else {
        return [...prev, feedId];
      }
    });
  };

  const handleNext = () => {
    if (selectedFeeds.length === 0) {
      return;
    }

    dispatch({ type: 'SET_FEEDS', payload: selectedFeeds });
    navigation.navigate('StepPlan');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Data Feeds</Text>
          <Text style={styles.subtitle}>
            Select the data sources for your Disaster Relief Coordinator
          </Text>
        </View>

        {/* Feed Options */}
        <View style={styles.feedsContainer}>
          {feedOptions.map((feed) => (
            <TouchableOpacity
              key={feed.id}
              style={[
                styles.feedCard,
                selectedFeeds.includes(feed.id) && styles.feedCardSelected,
              ]}
              onPress={() => toggleFeed(feed.id)}
            >
              <View style={styles.feedHeader}>
                <View style={[styles.feedIcon, { backgroundColor: feed.color }]}>
                  <Ionicons name={feed.icon} size={24} color={colors.textPrimary} />
                </View>
                <View style={styles.feedInfo}>
                  <Text style={styles.feedTitle}>{feed.title}</Text>
                  <Text style={styles.feedDescription}>{feed.description}</Text>
                </View>
                <Switch
                  value={selectedFeeds.includes(feed.id)}
                  onValueChange={() => toggleFeed(feed.id)}
                  trackColor={{ false: colors.border, true: feed.color }}
                  thumbColor={selectedFeeds.includes(feed.id) ? colors.textPrimary : colors.textMuted}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selection Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Selected Feeds ({selectedFeeds.length})</Text>
          <View style={styles.summaryChips}>
            {selectedFeeds.map((feedId) => {
              const feed = feedOptions.find(f => f.id === feedId);
              return (
                <View key={feedId} style={[styles.summaryChip, { backgroundColor: feed.color }]}>
                  <Text style={styles.summaryChipText}>{feed.title}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Warning */}
        {selectedFeeds.length === 0 && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={20} color={colors.warning} />
            <Text style={styles.warningText}>
              Please select at least one data feed to continue
            </Text>
          </View>
        )}

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, selectedFeeds.length === 0 && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={selectedFeeds.length === 0}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.textPrimary} />
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
  feedsContainer: {
    marginBottom: spacing.xl,
  },
  feedCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.small,
  },
  feedCardSelected: {
    borderColor: colors.red,
    backgroundColor: colors.surfaceLight,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  feedInfo: {
    flex: 1,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  feedDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  summaryContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  summaryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  summaryChipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  warningText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
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
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.red,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    ...shadows.medium,
  },
  nextButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
});

export default StepFeeds;
