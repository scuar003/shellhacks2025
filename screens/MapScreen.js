import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';
import LayerChips from '../components/LayerChips';

const { width, height } = Dimensions.get('window');

const MapScreen = () => {
  const { state, dispatch } = useApp();
  const [mapRef, setMapRef] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Default region (Miami area)
  const defaultRegion = {
    latitude: 25.7617,
    longitude: -80.1918,
    latitudeDelta: 0.3,
    longitudeDelta: 0.3,
  };

  const handleToggleLayer = (layer) => {
    dispatch({ type: 'TOGGLE_MAP_LAYER', payload: layer });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Map Updated', 'Latest data has been loaded');
    }, 1000);
  };

  const getMarkerColor = (type) => {
    switch (type) {
      case 'shelter': return colors.shelter;
      case 'closure': return colors.closure;
      case 'supply': return colors.supply;
      default: return colors.textSecondary;
    }
  };

  const getMarkerIcon = (type) => {
    switch (type) {
      case 'shelter': return 'home';
      case 'closure': return 'warning';
      case 'supply': return 'cube';
      default: return 'location';
    }
  };

  const renderShelterMarkers = () => {
    if (!state.mapLayers.shelters) return null;

    return state.shelters.map((shelter) => (
      <Marker
        key={shelter.id}
        coordinate={{ latitude: shelter.lat, longitude: shelter.lng }}
        pinColor={getMarkerColor('shelter')}
      >
        <Callout style={styles.callout}>
          <View style={styles.calloutContent}>
            <Text style={styles.calloutTitle}>{shelter.name}</Text>
            <View style={styles.calloutRow}>
              <Ionicons name="people" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>
                {shelter.occupied}/{shelter.capacity} capacity
              </Text>
            </View>
            <View style={styles.calloutRow}>
              <Ionicons name="time" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>
                Status: {shelter.status}
              </Text>
            </View>
            <View style={styles.calloutRow}>
              <Ionicons name="refresh" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>
                Updated: {new Date(shelter.updated).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </Callout>
      </Marker>
    ));
  };

  const renderClosureMarkers = () => {
    if (!state.mapLayers.closures) return null;

    return state.closures.map((closure) => (
      <Marker
        key={closure.id}
        coordinate={{ latitude: closure.lat, longitude: closure.lng }}
        pinColor={getMarkerColor('closure')}
      >
        <Callout style={styles.callout}>
          <View style={styles.calloutContent}>
            <Text style={styles.calloutTitle}>{closure.road}</Text>
            <View style={styles.calloutRow}>
              <Ionicons name="warning" size={14} color={colors.closure} />
              <Text style={styles.calloutText}>Cause: {closure.cause}</Text>
            </View>
            <View style={styles.calloutRow}>
              <Ionicons name="time" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>
                ETA: {closure.eta}
              </Text>
            </View>
            <View style={styles.calloutRow}>
              <Ionicons name="refresh" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>
                Updated: {new Date(closure.updated).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </Callout>
      </Marker>
    ));
  };

  const renderSupplyMarkers = () => {
    if (!state.mapLayers.supplies) return null;

    return state.supplies.map((supply) => (
      <Marker
        key={supply.id}
        coordinate={{ latitude: supply.lat, longitude: supply.lng }}
        pinColor={getMarkerColor('supply')}
      >
        <Callout style={styles.callout}>
          <View style={styles.calloutContent}>
            <Text style={styles.calloutTitle}>{supply.site}</Text>
            <View style={styles.calloutRow}>
              <Ionicons name="cube" size={14} color={colors.supply} />
              <Text style={styles.calloutText}>
                Items: {supply.items.join(', ')}
              </Text>
            </View>
            <View style={styles.calloutRow}>
              <Ionicons name="bar-chart" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>
                Stock: {supply.stock_pct}%
              </Text>
            </View>
            <View style={styles.calloutRow}>
              <Ionicons name="refresh" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>
                Updated: {new Date(supply.updated).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </Callout>
      </Marker>
    ));
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={setMapRef}
        style={styles.map}
        initialRegion={defaultRegion}
        mapType="standard"
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        customMapStyle={[
          {
            elementType: 'geometry',
            stylers: [
              {
                color: '#242f3e',
              },
            ],
          },
          {
            elementType: 'labels.text.fill',
            stylers: [
              {
                color: '#746855',
              },
            ],
          },
          {
            elementType: 'labels.text.stroke',
            stylers: [
              {
                color: '#242f3e',
              },
            ],
          },
        ]}
      >
        {renderShelterMarkers()}
        {renderClosureMarkers()}
        {renderSupplyMarkers()}
      </MapView>

      {/* Layer Controls */}
      <View style={styles.layerControls}>
        <LayerChips
          layers={state.mapLayers}
          onToggleLayer={handleToggleLayer}
        />
      </View>

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Ionicons
          name={refreshing ? "hourglass" : "refresh"}
          size={20}
          color={colors.textPrimary}
        />
      </TouchableOpacity>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.shelter }]} />
          <Text style={styles.legendText}>Shelters</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.closure }]} />
          <Text style={styles.legendText}>Road Closures</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.supply }]} />
          <Text style={styles.legendText}>Supply Sites</Text>
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
  map: {
    flex: 1,
  },
  layerControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(11, 11, 12, 0.9)',
    paddingVertical: spacing.sm,
  },
  refreshButton: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: colors.red,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  legend: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    backgroundColor: 'rgba(11, 11, 12, 0.9)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    minWidth: 150,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  callout: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
  },
  calloutContent: {
    padding: spacing.md,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  calloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  calloutText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
  },
});

export default MapScreen;
