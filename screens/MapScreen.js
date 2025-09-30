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
  const [showFilters, setShowFilters] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

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
      case 'infrastructure': return '#8B4513';
      case 'alert': return '#FF6B6B';
      case 'evacuation_route': return '#FFD93D';
      case 'safe_route': return '#4ECDC4';
      case 'hospital': return '#FF8A80';
      case 'emergency_service': return '#FF5722';
      case 'weather_station': return '#2196F3';
      default: return colors.textSecondary;
    }
  };

  const getMarkerIcon = (type) => {
    switch (type) {
      case 'shelter': return 'home';
      case 'closure': return 'warning';
      case 'supply': return 'cube';
      case 'infrastructure': return 'construct';
      case 'alert': return 'alert-circle';
      case 'evacuation_route': return 'arrow-forward';
      case 'safe_route': return 'checkmark-circle';
      case 'hospital': return 'medical';
      case 'emergency_service': return 'call';
      case 'weather_station': return 'partly-sunny';
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
                Updated: {new Date(shelter.last_updated || shelter.updated).toLocaleTimeString()}
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
                Updated: {new Date(supply.last_restocked || supply.updated).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </Callout>
      </Marker>
    ));
  };

  // Infrastructure markers (bridges, tunnels, airports)
  const renderInfrastructureMarkers = () => {
    if (!state.mapLayers.infrastructure) return null;

    const infrastructure = [
      ...(state.data?.bridges || []).map(bridge => ({ ...bridge, type: 'bridge' })),
      ...(state.data?.tunnels || []).map(tunnel => ({ ...tunnel, type: 'tunnel' })),
      ...(state.data?.airports || []).map(airport => ({ ...airport, type: 'airport' })),
    ];

    return infrastructure.map((item, index) => (
      <Marker
        key={`infra-${index}`}
        coordinate={{ latitude: item.lat, longitude: item.lng }}
        title={item.name}
        pinColor={getMarkerColor('infrastructure')}
      >
        <Callout style={styles.callout}>
          <View style={styles.calloutContent}>
            <Text style={styles.calloutTitle}>{item.name}</Text>
            <View style={styles.calloutRow}>
              <Ionicons name="construct" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>Type: {item.type}</Text>
            </View>
            <View style={styles.calloutRow}>
              <Ionicons name="checkmark-circle" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>Status: {item.status}</Text>
            </View>
          </View>
        </Callout>
      </Marker>
    ));
  };

  // Alert markers
  const renderAlertMarkers = () => {
    if (!state.mapLayers.alerts) return null;

    return state.alerts.map((alert, index) => (
      <Marker
        key={`alert-${index}`}
        coordinate={{ 
          latitude: alert.lat || defaultRegion.latitude + (Math.random() - 0.5) * 0.1, 
          longitude: alert.lng || defaultRegion.longitude + (Math.random() - 0.5) * 0.1 
        }}
        title={alert.title}
        pinColor={getMarkerColor('alert')}
      >
        <Callout style={styles.callout}>
          <View style={styles.calloutContent}>
            <Text style={styles.calloutTitle}>{alert.title}</Text>
            <View style={styles.calloutRow}>
              <Ionicons name="alert-circle" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>Severity: {alert.severity}</Text>
            </View>
            <View style={styles.calloutRow}>
              <Ionicons name="time" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>Time: {new Date(alert.time).toLocaleTimeString()}</Text>
            </View>
          </View>
        </Callout>
      </Marker>
    ));
  };

  // Evacuation route markers
  const renderEvacuationRouteMarkers = () => {
    if (!state.mapLayers.evacuation_routes) return null;

    const routes = state.data?.evacuation_routes || [];
    return routes.map((route, index) => (
      <Marker
        key={`evac-${index}`}
        coordinate={{ 
          latitude: defaultRegion.latitude + (Math.random() - 0.5) * 0.2, 
          longitude: defaultRegion.longitude + (Math.random() - 0.5) * 0.2 
        }}
        title={`Evacuation Route - ${route.zone}`}
        pinColor={getMarkerColor('evacuation_route')}
      >
        <Callout style={styles.callout}>
          <View style={styles.calloutContent}>
            <Text style={styles.calloutTitle}>{route.zone}</Text>
            <View style={styles.calloutRow}>
              <Ionicons name="arrow-forward" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>Primary: {route.primary_route}</Text>
            </View>
            <View style={styles.calloutRow}>
              <Ionicons name="arrow-back" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>Alternate: {route.alternate_route}</Text>
            </View>
            <View style={styles.calloutRow}>
              <Ionicons name="checkmark-circle" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>Status: {route.status}</Text>
            </View>
          </View>
        </Callout>
      </Marker>
    ));
  };

  // Safe route markers
  const renderSafeRouteMarkers = () => {
    if (!state.mapLayers.safe_routes) return null;

    const routes = state.data?.safe_routes || [];
    return routes.map((route, index) => (
      <Marker
        key={`safe-${index}`}
        coordinate={{ 
          latitude: defaultRegion.latitude + (Math.random() - 0.5) * 0.15, 
          longitude: defaultRegion.longitude + (Math.random() - 0.5) * 0.15 
        }}
        title={`Safe Route: ${route.from} to ${route.to}`}
        pinColor={getMarkerColor('safe_route')}
      >
        <Callout style={styles.callout}>
          <View style={styles.calloutContent}>
            <Text style={styles.calloutTitle}>{route.from} → {route.to}</Text>
            <View style={styles.calloutRow}>
              <Ionicons name="checkmark-circle" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>Status: {route.status}</Text>
            </View>
            <View style={styles.calloutRow}>
              <Ionicons name="time" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>ETA: {route.estimated_time}</Text>
            </View>
            <View style={styles.calloutRow}>
              <Ionicons name="map" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>Route: {route.route}</Text>
            </View>
          </View>
        </Callout>
      </Marker>
    ));
  };

  // Hospital markers
  const renderHospitalMarkers = () => {
    if (!state.mapLayers.hospitals) return null;

    // Generate some hospital locations based on the region
    const hospitals = [
      { name: `${state.currentRegion?.split(',')[0] || 'Miami'} General Hospital`, lat: defaultRegion.latitude + 0.05, lng: defaultRegion.longitude + 0.05, capacity: 200, available: 150 },
      { name: `${state.currentRegion?.split(',')[0] || 'Miami'} Medical Center`, lat: defaultRegion.latitude - 0.03, lng: defaultRegion.longitude + 0.08, capacity: 300, available: 280 },
      { name: `${state.currentRegion?.split(',')[0] || 'Miami'} Emergency Hospital`, lat: defaultRegion.latitude + 0.08, lng: defaultRegion.longitude - 0.05, capacity: 150, available: 120 },
    ];

    return hospitals.map((hospital, index) => (
      <Marker
        key={`hospital-${index}`}
        coordinate={{ latitude: hospital.lat, longitude: hospital.lng }}
        title={hospital.name}
        pinColor={getMarkerColor('hospital')}
      >
        <Callout style={styles.callout}>
          <View style={styles.calloutContent}>
            <Text style={styles.calloutTitle}>{hospital.name}</Text>
            <View style={styles.calloutRow}>
              <Ionicons name="medical" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>Capacity: {hospital.capacity}</Text>
            </View>
            <View style={styles.calloutRow}>
              <Ionicons name="bed" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>Available: {hospital.available}</Text>
            </View>
          </View>
        </Callout>
      </Marker>
    ));
  };

  // Emergency services markers
  const renderEmergencyServiceMarkers = () => {
    if (!state.mapLayers.emergency_services) return null;

    const services = [
      { name: 'Fire Station 1', lat: defaultRegion.latitude + 0.02, lng: defaultRegion.longitude + 0.03, type: 'fire', status: 'active' },
      { name: 'Police Station', lat: defaultRegion.latitude - 0.04, lng: defaultRegion.longitude + 0.06, type: 'police', status: 'active' },
      { name: 'EMS Station', lat: defaultRegion.latitude + 0.06, lng: defaultRegion.longitude - 0.02, type: 'ems', status: 'active' },
    ];

    return services.map((service, index) => (
      <Marker
        key={`emergency-${index}`}
        coordinate={{ latitude: service.lat, longitude: service.lng }}
        title={service.name}
        pinColor={getMarkerColor('emergency_service')}
      >
        <Callout style={styles.callout}>
          <View style={styles.calloutContent}>
            <Text style={styles.calloutTitle}>{service.name}</Text>
            <View style={styles.calloutRow}>
              <Ionicons name="call" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>Type: {service.type.toUpperCase()}</Text>
            </View>
            <View style={styles.calloutRow}>
              <Ionicons name="checkmark-circle" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>Status: {service.status}</Text>
            </View>
          </View>
        </Callout>
      </Marker>
    ));
  };

  // Weather station markers
  const renderWeatherStationMarkers = () => {
    if (!state.mapLayers.weather_stations) return null;

    const stations = [
      { name: 'Weather Station 1', lat: defaultRegion.latitude + 0.01, lng: defaultRegion.longitude + 0.04, temp: '75°F', conditions: 'Clear' },
      { name: 'Weather Station 2', lat: defaultRegion.latitude - 0.05, lng: defaultRegion.longitude + 0.02, temp: '78°F', conditions: 'Partly Cloudy' },
      { name: 'Weather Station 3', lat: defaultRegion.latitude + 0.07, lng: defaultRegion.longitude - 0.03, temp: '73°F', conditions: 'Windy' },
    ];

    return stations.map((station, index) => (
      <Marker
        key={`weather-${index}`}
        coordinate={{ latitude: station.lat, longitude: station.lng }}
        title={station.name}
        pinColor={getMarkerColor('weather_station')}
      >
        <Callout style={styles.callout}>
          <View style={styles.calloutContent}>
            <Text style={styles.calloutTitle}>{station.name}</Text>
            <View style={styles.calloutRow}>
              <Ionicons name="thermometer" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>Temperature: {station.temp}</Text>
            </View>
            <View style={styles.calloutRow}>
              <Ionicons name="partly-sunny" size={14} color={colors.textSecondary} />
              <Text style={styles.calloutText}>Conditions: {station.conditions}</Text>
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
        {renderInfrastructureMarkers()}
        {renderAlertMarkers()}
        {renderEvacuationRouteMarkers()}
        {renderSafeRouteMarkers()}
        {renderHospitalMarkers()}
        {renderEmergencyServiceMarkers()}
        {renderWeatherStationMarkers()}
      </MapView>

      {/* Filter Toggle Button */}
      <TouchableOpacity 
        style={styles.filterToggleButton} 
        onPress={() => setShowFilters(!showFilters)}
      >
        <Ionicons 
          name={showFilters ? "close" : "filter"} 
          size={20} 
          color={colors.textPrimary} 
        />
        <Text style={styles.filterToggleText}>
          {showFilters ? "Hide Filters" : "Filters"}
        </Text>
      </TouchableOpacity>

      {/* Layer Controls - Collapsible */}
      {showFilters && (
        <View style={styles.layerControls}>
          <LayerChips
            layers={state.mapLayers}
            onToggleLayer={handleToggleLayer}
          />
        </View>
      )}

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Ionicons
          name={refreshing ? "hourglass" : "refresh"}
          size={20}
          color={colors.textPrimary}
        />
      </TouchableOpacity>

      {/* Legend Toggle Button */}
      <TouchableOpacity 
        style={styles.legendToggleButton} 
        onPress={() => setShowLegend(!showLegend)}
      >
        <Ionicons 
          name={showLegend ? "close" : "information-circle"} 
          size={20} 
          color={colors.textPrimary} 
        />
        <Text style={styles.legendToggleText}>
          {showLegend ? "Hide Legend" : "Legend"}
        </Text>
      </TouchableOpacity>

      {/* Legend - Collapsible */}
      {showLegend && (
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Map Legend</Text>
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
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#8B4513' }]} />
            <Text style={styles.legendText}>Infrastructure</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.legendText}>Alerts</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFD93D' }]} />
            <Text style={styles.legendText}>Evacuation Routes</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4ECDC4' }]} />
            <Text style={styles.legendText}>Safe Routes</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF8A80' }]} />
            <Text style={styles.legendText}>Hospitals</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF5722' }]} />
            <Text style={styles.legendText}>Emergency Services</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
            <Text style={styles.legendText}>Weather Stations</Text>
          </View>
        </View>
      )}
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
  filterToggleButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: colors.red,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.medium,
  },
  filterToggleText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  layerControls: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(11, 11, 12, 0.95)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    ...shadows.large,
    maxHeight: height * 0.4,
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
  legendToggleButton: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    backgroundColor: colors.red,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.medium,
  },
  legendToggleText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  legend: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    backgroundColor: 'rgba(11, 11, 12, 0.95)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    minWidth: 180,
    maxHeight: height * 0.4,
    ...shadows.large,
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
