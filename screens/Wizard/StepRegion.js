import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

const regionSuggestions = [
  'Miami, FL',
  'Tampa, FL',
  'Orlando, FL',
  'Jacksonville, FL',
  'Tallahassee, FL',
  'Fort Lauderdale, FL',
  'West Palm Beach, FL',
  'Naples, FL',
];

const StepRegion = ({ navigation }) => {
  const { state, dispatch } = useApp();
  const [selectedRegion, setSelectedRegion] = useState(state.currentRegion || '');
  const [customRegion, setCustomRegion] = useState('');

  const handleRegionSelect = (region) => {
    setSelectedRegion(region);
    setCustomRegion('');
  };

  const handleCustomRegion = (text) => {
    setCustomRegion(text);
    setSelectedRegion(text);
  };

  const handleNext = () => {
    if (!selectedRegion.trim()) {
      Alert.alert('Region Required', 'Please select or enter a region to continue.');
      return;
    }

    dispatch({ type: 'SET_REGION', payload: selectedRegion });
    navigation.navigate('StepFeeds');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Region</Text>
          <Text style={styles.subtitle}>
            Choose the area where you want to deploy the Disaster Relief Coordinator
          </Text>
        </View>

        {/* Custom Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Enter Region</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Miami-Dade County, FL"
            placeholderTextColor={colors.textMuted}
            value={customRegion}
            onChangeText={handleCustomRegion}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Suggestions */}
        <View style={styles.suggestionsContainer}>
          <Text style={styles.label}>Quick Select</Text>
          <View style={styles.suggestionsGrid}>
            {regionSuggestions.map((region) => (
              <TouchableOpacity
                key={region}
                style={[
                  styles.suggestionChip,
                  selectedRegion === region && styles.suggestionChipSelected,
                ]}
                onPress={() => handleRegionSelect(region)}
              >
                <Text
                  style={[
                    styles.suggestionText,
                    selectedRegion === region && styles.suggestionTextSelected,
                  ]}
                >
                  {region}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selected Region Display */}
        {selectedRegion && (
          <View style={styles.selectedContainer}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.selectedText}>Selected: {selectedRegion}</Text>
          </View>
        )}

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, !selectedRegion && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!selectedRegion}
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
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    ...shadows.small,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  suggestionsContainer: {
    marginBottom: spacing.xl,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.small,
  },
  suggestionChipSelected: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  suggestionTextSelected: {
    color: colors.textPrimary,
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    ...shadows.small,
  },
  selectedText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    fontWeight: '500',
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

export default StepRegion;
