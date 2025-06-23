/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Alert,
  AppState,
} from 'react-native';
import NativePermissionManager from './src/NativePermissionManager';

// Import the functions from the library
import {
  initialize,
  presentConsentBanner,
  presentPreferenceCenter,
  isSdkReady,
  isReady,
  resetConsents,
  getConsentByPurposeId,
  getConsentByPermissionId,
  getPermissions,
  getPurposes,
  getSdksInPurpose,
  setPurposeConsent,
  setPermissionConsent,
  getBannerConfig,
  getSettingsPrompt,
  options,
  LoggerLevel,
  ConsentStatusValues,
} from 'securiti-consent-sdk';

// For types
import type {
  Purpose,
  AppPermission,
  CmpSDKOptions
} from 'securiti-consent-sdk';

// Import package.json to get SDK version
import packageJson from './package.json';

// Define iOS permission IDs as per your requirement
const IOS_PERMISSION_IDS = [
  'NSAppleMusicUsageDescription',
  'NSPhotoLibraryUsageDescription', 
  'NSCameraUsageDescription',
  'NSMicrophoneUsageDescription',
  'NSContactsUsageDescription',
  'NSCalendarsUsageDescription',
  'NSRemindersUsageDescription',
  'NSLocationWhenInUseUsageDescription',
  'NSLocationAlwaysUsageDescription',
  'NSSpeechRecognitionUsageDescription',
  'NSUserTrackingUsageDescription',
  'NSFaceIDUsageDescription',
  'NSMotionUsageDescription',
  'NSHealthShareUsageDescription',
  'NSBluetoothAlwaysUsageDescription',
  'NSBluetoothPeripheralUsageDescription',
  'NSLocalNetworkUsageDescription',
];

// We'll use the isReady callback instead of native events

export default function App() {
  const [sdkReady, setSdkReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<null | any>(null);
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [permissions, setPermissions] = useState<AppPermission[]>([]);
  const [updatingPermission, setUpdatingPermission] = useState<string | null>(null);

  useEffect(() => {
    // Handle app state changes to refresh permissions when returning from settings
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App became active, refresh permissions data
        if (sdkReady) {
          loadInitialData();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Initialize SDK with appropriate options based on platform
   const initOptions: CmpSDKOptions = Platform.OS === 'android'
      ? {
          appURL: 'Your Android App URL',
          cdnURL: 'Your Android CDN URL',
          tenantID: 'Your Tenant ID',
          appID: 'Your Android App ID',
          testingMode: true,
          loggerLevel: LoggerLevel.DEBUG,
          consentsCheckInterval: 3600,
          subjectId: 'reactNativeAndroidSubject',
          languageCode: 'Your Language Code',
          locationCode: 'Your Location Code',
        }
      : {
          appURL: 'Your iOS App URL',
          cdnURL: 'Your iOS CDN URL',
          tenantID: 'Your Tenant ID',
          appID: 'Your iOS App ID',
          testingMode: true,
          loggerLevel: LoggerLevel.DEBUG,
          consentsCheckInterval: 3600,
          subjectId: 'reactNativeiOSSubject',
          languageCode: 'Your Language Code',
          locationCode: 'Your Location Code',
        };

    initialize(initOptions);

    // Use the isReady callback instead of events
    isReady((status: boolean) => {
      console.log('SDK ready callback received:', status);
      setSdkReady(status);
      if (status) {
        loadInitialData();
      }
    });

    // Also check using the synchronous method
    checkSdkReadiness();

    // Clean up event listeners
    return () => {
      subscription?.remove();
    };
  }, []);

  const checkSdkReadiness = () => {
    // Synchronous check
    try {
      const ready = isSdkReady();
      setSdkReady(ready);
      console.log('SDK ready (sync check):', ready);

      if (ready) {
        handleShowBanner();
        loadInitialData();
      } else {
        // Also try the callback-based method
        isReady((ready: boolean) => {
          console.log('SDK ready (callback):', ready);
          setSdkReady(ready);
          if (ready) {
            handleShowBanner();
            loadInitialData();
          }
        });
      }
    } catch (error) {
      console.error('Error checking SDK readiness:', error);
    }
  };

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      console.log('Loading initial data...');

      // Load purposes and permissions in parallel
      const [purposesResult, permissionsResult] = await Promise.all([
        getPurposes(),
        getPermissions()
      ]);

      console.log('Purposes loaded:', purposesResult?.length || 0);
      console.log('Permissions loaded:', permissionsResult?.length || 0);

      setPurposes(purposesResult || []);
      setPermissions(permissionsResult || []);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      Alert.alert('Error', 'Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowBanner = () => {
    try {
      presentConsentBanner();
      console.log('Consent banner presented');
    } catch (error) {
      console.error('Error presenting consent banner:', error);
      Alert.alert('Error', 'Failed to show consent banner');
    }
  };

  const handleShowPreferenceCenter = () => {
    try {
      presentPreferenceCenter();
      console.log('Preference center presented');
    } catch (error) {
      console.error('Error presenting preference center:', error);
      Alert.alert('Error', 'Failed to show preference center');
    }
  };

  const handleResetConsents = () => {
    setResponse(null);
    try {
      resetConsents();
      setResponse({
        message: 'Consents have been reset',
        timestamp: new Date().toISOString()
      });
      loadInitialData(); // Refresh data
    } catch (error) {
      console.error('Error resetting consents:', error);
      setResponse({ error: 'Failed to reset consents: ' + error });
    }
  };

  const handleGetPurposes = async () => {
    setResponse(null);
    setIsLoading(true);
    try {
      const result = await getPurposes();
      setResponse({
        purposes: result,
        timestamp: new Date().toISOString()
      });
      setPurposes(result || []);
    } catch (error) {
      console.error('Error getting purposes:', error);
      setResponse({ error: 'Failed to get purposes: ' + error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetPermissions = async () => {
    setResponse(null);
    setIsLoading(true);
    try {
      const result = await getPermissions();
      setResponse({
        permissions: result,
        timestamp: new Date().toISOString()
      });
      setPermissions(result || []);
    } catch (error) {
      console.error('Error getting permissions:', error);
      setResponse({ error: 'Failed to get permissions: ' + error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetSdksInPurpose = async (purposeId: number) => {
    setResponse(null);
    setIsLoading(true);
    try {
      const result = await getSdksInPurpose(purposeId);
      setResponse({
        purposeId,
        sdks: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting SDKs:', error);
      setResponse({ error: `Failed to get SDKs for purpose ${purposeId}: ` + error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetBannerConfig = async () => {
    setResponse(null);
    setIsLoading(true);
    try {
      const result = await getBannerConfig(null);
      setResponse({
        bannerConfig: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting banner config:', error);
      setResponse({ error: 'Failed to get banner config: ' + error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetSettingsPrompt = async () => {
    setResponse(null);
    setIsLoading(true);
    try {
      const result = await getSettingsPrompt();
      setResponse({
        settingsPrompt: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting settings prompt:', error);
      setResponse({ error: 'Failed to get settings prompt: ' + error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetOptions = () => {
    setResponse(null);
    try {
      const sdkOptions = options();
      setResponse({
        options: sdkOptions,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting options:', error);
      setResponse({ error: 'Failed to get options: ' + error });
    }
  };

  const handleGetConsentForPurpose = async (purposeId: number) => {
    setResponse(null);
    setIsLoading(true);
    try {
      const result = await getConsentByPurposeId(purposeId);
      setResponse({
        purposeId,
        consentStatus: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting purpose consent:', error);
      setResponse({ error: `Failed to get consent for purpose ${purposeId}: ` + error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetConsentForPermission = async (permissionId: string) => {
    setResponse(null);
    setIsLoading(true);
    try {
      const result = await getConsentByPermissionId(permissionId);
      setResponse({
        permissionId,
        consentStatus: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting permission consent:', error);
      setResponse({ error: `Failed to get consent for permission ${permissionId}: ` + error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetConsentForPurpose = async (purpose: Purpose, consent: string) => {
    setResponse(null);
    setIsLoading(true);
    try {
      const success = setPurposeConsent(purpose, consent);
      console.log(`Set purpose consent result: ${success}`);

      // Give time for consent to apply
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get updated status
      const newStatus = await getConsentByPurposeId(purpose.purposeId || 0);

      setResponse({
        message: `Set consent for purpose ${purpose.purposeId} to ${consent}`,
        success,
        newStatus,
        timestamp: new Date().toISOString()
      });

      // Refresh purposes list
      const updatedPurposes = await getPurposes();
      setPurposes(updatedPurposes || []);
    } catch (error) {
      console.error('Error setting purpose consent:', error);
      setResponse({ error: `Failed to set consent for purpose ${purpose.purposeId}: ` + error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetConsentForPermission = async (permission: AppPermission, consent: string) => {
    setResponse(null);
    setIsLoading(true);
    try {
      const success = setPermissionConsent(permission, consent);
      console.log(`Set permission consent result: ${success}`);

      // Give time for consent to apply
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get updated status
      const newStatus = await getConsentByPermissionId(permission.permissionId || '');

      setResponse({
        message: `Set consent for permission ${permission.permissionId} to ${consent}`,
        success,
        newStatus,
        timestamp: new Date().toISOString()
      });

      // Refresh permissions list
      const updatedPermissions = await getPermissions();
      setPermissions(updatedPermissions || []);
    } catch (error) {
      console.error('Error setting permission consent:', error);
      setResponse({ error: `Failed to set consent for permission ${permission.permissionId}: ` + error });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to update a specific permission's status in the UI
  const updatePermissionStatus = async (permissionId: string) => {
    try {
      setUpdatingPermission(permissionId);
      
      // Get the updated consent status from Securiti SDK
      const updatedStatus = await getConsentByPermissionId(permissionId);
      
      // Update the permissions array
      setPermissions(prevPermissions => 
        prevPermissions.map(permission => 
          permission.permissionId === permissionId 
            ? { ...permission, consentStatus: updatedStatus }
            : permission
        )
      );
    } catch (error) {
      console.error('Error updating permission status:', error);
    } finally {
      setUpdatingPermission(null);
    }
  };

  // NEW: Native permission request functionality
  const handleRequestNativePermission = async (permissionId: string) => {
    setResponse(null);
    setIsLoading(true);
    
    try {
      if (Platform.OS === 'android') {
        // Android: Always go to settings
        const success = await NativePermissionManager.openSettings();
        setResponse({
          message: `Opened settings for permission: ${permissionId}`,
          success,
          timestamp: new Date().toISOString()
        });
      } else if (Platform.OS === 'ios') {
        // iOS: Check current status first, then either request or go to settings
        const currentStatus = await NativePermissionManager.checkPermission(permissionId);
        
        if (currentStatus === 'not_determined') {
          // Permission not determined, we can request it
          const result = await NativePermissionManager.requestPermission(permissionId);
          
          // Update the specific permission status in the UI
          await updatePermissionStatus(permissionId);
          
          setResponse({
            message: `Requested permission: ${permissionId}`,
            previousStatus: currentStatus,
            result,
            timestamp: new Date().toISOString()
          });
        } else {
          // Permission already determined, go to settings
          const success = await NativePermissionManager.openSettings();
          setResponse({
            message: `Permission ${permissionId} already determined (${currentStatus}), opened settings`,
            currentStatus,
            success,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error requesting native permission:', error);
      setResponse({ 
        error: `Failed to request permission ${permissionId}: ` + error,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderPurposeItem = (purpose: Purpose) => {
    const purposeName = purpose.purposeName?.['en'] || `Purpose ${purpose.purposeId}`;

    return (
      <View style={styles.itemContainer} key={purpose.purposeId}>
        <Text style={styles.itemTitle}>{purposeName}</Text>
        <Text style={styles.itemSubtitle}>ID: {purpose.purposeId}</Text>
        <Text style={styles.itemSubtitle}>Status: {purpose.consentStatus || 'unknown'}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.smallButton, styles.detailButton]}
            onPress={() => handleGetConsentForPurpose(purpose.purposeId || 0)}
          >
            <Text style={styles.smallButtonText}>Get Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallButton, styles.detailButton]}
            onPress={() => handleGetSdksInPurpose(purpose.purposeId || 0)}
          >
            <Text style={styles.smallButtonText}>Get SDKs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallButton, styles.grantButton]}
            onPress={() => handleSetConsentForPurpose(purpose, ConsentStatusValues.GRANTED)}
          >
            <Text style={styles.smallButtonText}>Grant</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallButton, styles.declineButton]}
            onPress={() => handleSetConsentForPurpose(purpose, ConsentStatusValues.DECLINED)}
          >
            <Text style={styles.smallButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPermissionItem = (permission: AppPermission) => {
    const permissionName = permission.name || permission.permissionId || 'Unknown Permission';
    const isIOSPermission = IOS_PERMISSION_IDS.includes(permission.permissionId || '');
    const isUpdating = updatingPermission === permission.permissionId;

    return (
      <View style={styles.itemContainer} key={permission.permissionId}>
        <Text style={styles.itemTitle}>{permissionName}</Text>
        <Text style={styles.itemSubtitle}>ID: {permission.permissionId}</Text>
        <View style={styles.statusRow}>
          <Text style={styles.itemSubtitle}>Status: {permission.consentStatus || 'unknown'}</Text>
          {isUpdating && (
            <ActivityIndicator size="small" color="#007AFF" style={styles.statusLoader} />
          )}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.smallButton, styles.detailButton]}
            onPress={() => handleGetConsentForPermission(permission.permissionId || '')}
          >
            <Text style={styles.smallButtonText}>Get Status</Text>
          </TouchableOpacity>

          {/* NEW: Request button for iOS permissions */}
          {isIOSPermission && (
            <TouchableOpacity
              style={[styles.smallButton, styles.requestButton]}
              onPress={() => handleRequestNativePermission(permission.permissionId || '')}
            >
              <Text style={styles.smallButtonText}>Request</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.smallButton, styles.grantButton]}
            onPress={() => handleSetConsentForPermission(permission, ConsentStatusValues.GRANTED)}
          >
            <Text style={styles.smallButtonText}>Grant</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallButton, styles.declineButton]}
            onPress={() => handleSetConsentForPermission(permission, ConsentStatusValues.DECLINED)}
          >
            <Text style={styles.smallButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}>
        <View style={styles.header}>
          <Text style={styles.title}>Securiti Consent SDK Demo</Text>
          <Text style={styles.subtitle}>
            SDK Status: {sdkReady ? 'Ready' : 'Initializing...'}
          </Text>
          <Text style={styles.subtitle}>
            SDK Version: {packageJson.dependencies['securiti-consent-sdk']}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Banner Controls</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleShowPreferenceCenter}
            >
              <Text style={styles.buttonText}>Preference Center</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Configuration</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleGetBannerConfig}
            >
              <Text style={styles.buttonText}>Banner Config</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleGetSettingsPrompt}
            >
              <Text style={styles.buttonText}>Settings Prompt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleGetOptions}
            >
              <Text style={styles.buttonText}>SDK Options</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage Data</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleGetPurposes}
            >
              <Text style={styles.buttonText}>Get Purposes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleGetPermissions}
            >
              <Text style={styles.buttonText}>Get Permissions</Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={[styles.button, styles.warningButton]}
              onPress={handleResetConsents}
            >
              <Text style={styles.buttonText}>Reset Consents</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}

        {response && (
          <View style={styles.responseContainer}>
            <Text style={styles.sectionTitle}>Response:</Text>
            <ScrollView
              style={styles.responseScrollView}
              contentContainerStyle={styles.responseScrollContent}
              nestedScrollEnabled={true}
            >
              <Text selectable={true} style={styles.responseText}>
                {JSON.stringify(response, null, 2)}
              </Text>
            </ScrollView>
          </View>
        )}

        {/* Purposes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purposes</Text>
          {purposes.length === 0 ? (
            <Text style={styles.emptyText}>No purposes available</Text>
          ) : (
            purposes.map(renderPurposeItem)
          )}
        </View>

        {/* Permissions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          {permissions.length === 0 ? (
            <Text style={styles.emptyText}>No permissions available</Text>
          ) : (
            permissions.map(renderPermissionItem)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -4,
  },
  button: {
    margin: 4,
    padding: 12,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#4CAF50',
  },
  actionButton: {
    backgroundColor: '#9C27B0',
  },
  warningButton: {
    backgroundColor: '#FF5722',
  },
  smallButton: {
    margin: 2,
    padding: 6,
    borderRadius: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  smallButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  detailButton: {
    backgroundColor: '#607D8B',
  },
  grantButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#F44336',
  },
  requestButton: {
    backgroundColor: '#FF9800',
  },
  loaderContainer: {
    padding: 20,
    alignItems: 'center',
  },
  responseContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    height: 300,
  },
  responseScrollView: {
    flex: 1,
    marginTop: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  responseScrollContent: {
    padding: 8,
  },
  responseText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
  },
  itemContainer: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
    color: '#666',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusLoader: {
    marginLeft: 8,
  },
});