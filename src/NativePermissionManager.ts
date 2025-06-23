import { NativeModules, Platform } from 'react-native';

interface PermissionResult {
  status: 'granted' | 'denied' | 'not_determined' | 'not_available' | 'limited' | 'granted_always' | 'granted_when_in_use';
  alreadyDetermined?: boolean;
  error?: string;
  note?: string;
}

interface INativePermissionManager {
  requestPermission(permissionType: string): Promise<PermissionResult>;
  checkPermission(permissionType: string): Promise<string>;
  openSettings(): Promise<boolean>;
}

// Create a fallback for when the native module isn't availableXrxrx
const fallbackModule: INativePermissionManager = {
  requestPermission: async (permissionType: string): Promise<PermissionResult> => {
    console.warn('Native permission module not available, opening settings');
    if (Platform.OS === 'ios') {
      // Fallback to opening settings
      await fallbackModule.openSettings();
      return { status: 'not_available', note: 'Native module not available' };
    } else {
      // Android - always go to settings
      await fallbackModule.openSettings();
      return { status: 'not_available', note: 'Android always goes to settings' };
    }
  },
  
  checkPermission: async (permissionType: string): Promise<string> => {
    console.warn('Native permission module not available');
    return 'not_available';
  },
  
  openSettings: async (): Promise<boolean> => {
    console.warn('Opening settings not available');
    return false;
  },
};

const NativePermissionManager: INativePermissionManager = 
  NativeModules.RNPermissionManager || fallbackModule;

export default NativePermissionManager;
export type { PermissionResult };