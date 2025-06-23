#import "RNPermissionManager.h"
#import <AVFoundation/AVFoundation.h>
#import <Photos/Photos.h>
#import <Contacts/Contacts.h>
#import <EventKit/EventKit.h>
#import <CoreLocation/CoreLocation.h>
#import <Speech/Speech.h>
#import <MediaPlayer/MediaPlayer.h>
#import <CoreMotion/CoreMotion.h>
#import <LocalAuthentication/LocalAuthentication.h>
#import <UIKit/UIKit.h>

#if __has_include(<AppTrackingTransparency/AppTrackingTransparency.h>)
#import <AppTrackingTransparency/AppTrackingTransparency.h>
#endif

@interface RNPermissionManager() <CLLocationManagerDelegate>
@property (nonatomic, strong) CLLocationManager *locationManager;
@property (nonatomic, copy) RCTPromiseResolveBlock locationResolve;
@property (nonatomic, copy) RCTPromiseRejectBlock locationReject;
@end

@implementation RNPermissionManager

RCT_EXPORT_MODULE();

- (instancetype)init {
    self = [super init];
    if (self) {
        self.locationManager = [[CLLocationManager alloc] init];
        self.locationManager.delegate = self;
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

RCT_EXPORT_METHOD(requestPermission:(NSString *)permissionType
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([permissionType isEqualToString:@"NSCameraUsageDescription"]) {
            [self requestCameraPermission:resolve rejecter:reject];
        } else if ([permissionType isEqualToString:@"NSMicrophoneUsageDescription"]) {
            [self requestMicrophonePermission:resolve rejecter:reject];
        } else if ([permissionType isEqualToString:@"NSPhotoLibraryUsageDescription"]) {
            [self requestPhotoLibraryPermission:resolve rejecter:reject];
        } else if ([permissionType isEqualToString:@"NSContactsUsageDescription"]) {
            [self requestContactsPermission:resolve rejecter:reject];
        } else if ([permissionType isEqualToString:@"NSCalendarsUsageDescription"]) {
            [self requestCalendarsPermission:resolve rejecter:reject];
        } else if ([permissionType isEqualToString:@"NSRemindersUsageDescription"]) {
            [self requestRemindersPermission:resolve rejecter:reject];
        } else if ([permissionType isEqualToString:@"NSLocationWhenInUseUsageDescription"]) {
            [self requestLocationWhenInUsePermission:resolve rejecter:reject];
        } else if ([permissionType isEqualToString:@"NSLocationAlwaysUsageDescription"]) {
            [self requestLocationAlwaysPermission:resolve rejecter:reject];
        } else if ([permissionType isEqualToString:@"NSSpeechRecognitionUsageDescription"]) {
            [self requestSpeechRecognitionPermission:resolve rejecter:reject];
        } else if ([permissionType isEqualToString:@"NSAppleMusicUsageDescription"]) {
            [self requestMediaLibraryPermission:resolve rejecter:reject];
        } else if ([permissionType isEqualToString:@"NSMotionUsageDescription"]) {
            [self requestMotionPermission:resolve rejecter:reject];
        } else if ([permissionType isEqualToString:@"NSFaceIDUsageDescription"]) {
            [self requestFaceIDPermission:resolve rejecter:reject];
        } else if ([permissionType isEqualToString:@"NSUserTrackingUsageDescription"]) {
            [self requestAppTrackingPermission:resolve rejecter:reject];
        } else {
            reject(@"unsupported_permission", [NSString stringWithFormat:@"Permission type %@ is not supported", permissionType], nil);
        }
    });
}

RCT_EXPORT_METHOD(checkPermission:(NSString *)permissionType
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    dispatch_async(dispatch_get_main_queue(), ^{
        NSString *status = [self getPermissionStatus:permissionType];
        resolve(status);
    });
}

RCT_EXPORT_METHOD(openSettings:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    dispatch_async(dispatch_get_main_queue(), ^{
        // Use the official iOS method to open app-specific settings
        NSURL *settingsURL = [NSURL URLWithString:UIApplicationOpenSettingsURLString];
        if (settingsURL && [[UIApplication sharedApplication] canOpenURL:settingsURL]) {
            [[UIApplication sharedApplication] openURL:settingsURL 
                                               options:@{UIApplicationOpenURLOptionUniversalLinksOnly: @NO} 
                                     completionHandler:^(BOOL success) {
                resolve(@(success));
            }];
        } else {
            reject(@"cannot_open_settings", @"Cannot open app settings", nil);
        }
    });
}

- (NSString *)getPermissionStatus:(NSString *)permissionType {
    if ([permissionType isEqualToString:@"NSCameraUsageDescription"]) {
        return [self getCameraPermissionStatus];
    } else if ([permissionType isEqualToString:@"NSMicrophoneUsageDescription"]) {
        return [self getMicrophonePermissionStatus];
    } else if ([permissionType isEqualToString:@"NSPhotoLibraryUsageDescription"]) {
        return [self getPhotoLibraryPermissionStatus];
    } else if ([permissionType isEqualToString:@"NSContactsUsageDescription"]) {
        return [self getContactsPermissionStatus];
    } else if ([permissionType isEqualToString:@"NSCalendarsUsageDescription"]) {
        return [self getCalendarsPermissionStatus];
    } else if ([permissionType isEqualToString:@"NSRemindersUsageDescription"]) {
        return [self getRemindersPermissionStatus];
    } else if ([permissionType isEqualToString:@"NSLocationWhenInUseUsageDescription"] || 
               [permissionType isEqualToString:@"NSLocationAlwaysUsageDescription"]) {
        return [self getLocationPermissionStatus];
    } else if ([permissionType isEqualToString:@"NSSpeechRecognitionUsageDescription"]) {
        return [self getSpeechRecognitionPermissionStatus];
    } else if ([permissionType isEqualToString:@"NSAppleMusicUsageDescription"]) {
        return [self getMediaLibraryPermissionStatus];
    } else if ([permissionType isEqualToString:@"NSMotionUsageDescription"]) {
        return [self getMotionPermissionStatus];
    } else if ([permissionType isEqualToString:@"NSFaceIDUsageDescription"]) {
        return [self getFaceIDPermissionStatus];
    } else if ([permissionType isEqualToString:@"NSUserTrackingUsageDescription"]) {
        return [self getAppTrackingPermissionStatus];
    }
    return @"unsupported";
}

// Camera Permission
- (void)requestCameraPermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
    AVAuthorizationStatus status = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
    
    if (status == AVAuthorizationStatusNotDetermined) {
        [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
            dispatch_async(dispatch_get_main_queue(), ^{
                resolve(@{@"status": granted ? @"granted" : @"denied"});
            });
        }];
    } else {
        resolve(@{@"status": [self getCameraPermissionStatus], @"alreadyDetermined": @YES});
    }
}

- (NSString *)getCameraPermissionStatus {
    AVAuthorizationStatus status = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
    switch (status) {
        case AVAuthorizationStatusAuthorized:
            return @"granted";
        case AVAuthorizationStatusDenied:
        case AVAuthorizationStatusRestricted:
            return @"denied";
        case AVAuthorizationStatusNotDetermined:
            return @"not_determined";
        default:
            return @"unknown";
    }
}

// Microphone Permission
- (void)requestMicrophonePermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
    AVAuthorizationStatus status = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeAudio];
    
    if (status == AVAuthorizationStatusNotDetermined) {
        [AVCaptureDevice requestAccessForMediaType:AVMediaTypeAudio completionHandler:^(BOOL granted) {
            dispatch_async(dispatch_get_main_queue(), ^{
                resolve(@{@"status": granted ? @"granted" : @"denied"});
            });
        }];
    } else {
        resolve(@{@"status": [self getMicrophonePermissionStatus], @"alreadyDetermined": @YES});
    }
}

- (NSString *)getMicrophonePermissionStatus {
    AVAuthorizationStatus status = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeAudio];
    switch (status) {
        case AVAuthorizationStatusAuthorized:
            return @"granted";
        case AVAuthorizationStatusDenied:
        case AVAuthorizationStatusRestricted:
            return @"denied";
        case AVAuthorizationStatusNotDetermined:
            return @"not_determined";
        default:
            return @"unknown";
    }
}

// Photo Library Permission
- (void)requestPhotoLibraryPermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
    PHAuthorizationStatus status = [PHPhotoLibrary authorizationStatus];
    
    if (status == PHAuthorizationStatusNotDetermined) {
        [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus newStatus) {
            dispatch_async(dispatch_get_main_queue(), ^{
                resolve(@{@"status": [self photoLibraryStatusToString:newStatus]});
            });
        }];
    } else {
        resolve(@{@"status": [self getPhotoLibraryPermissionStatus], @"alreadyDetermined": @YES});
    }
}

- (NSString *)getPhotoLibraryPermissionStatus {
    PHAuthorizationStatus status = [PHPhotoLibrary authorizationStatus];
    return [self photoLibraryStatusToString:status];
}

- (NSString *)photoLibraryStatusToString:(PHAuthorizationStatus)status {
    switch (status) {
        case PHAuthorizationStatusAuthorized:
            return @"granted";
        case PHAuthorizationStatusLimited:
            return @"limited";
        case PHAuthorizationStatusDenied:
        case PHAuthorizationStatusRestricted:
            return @"denied";
        case PHAuthorizationStatusNotDetermined:
            return @"not_determined";
        default:
            return @"unknown";
    }
}

// Contacts Permission
- (void)requestContactsPermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
    CNAuthorizationStatus status = [CNContactStore authorizationStatusForEntityType:CNEntityTypeContacts];
    
    if (status == CNAuthorizationStatusNotDetermined) {
        CNContactStore *store = [[CNContactStore alloc] init];
        [store requestAccessForEntityType:CNEntityTypeContacts completionHandler:^(BOOL granted, NSError * _Nullable error) {
            dispatch_async(dispatch_get_main_queue(), ^{
                if (error) {
                    reject(@"contacts_error", error.localizedDescription, error);
                } else {
                    resolve(@{@"status": granted ? @"granted" : @"denied"});
                }
            });
        }];
    } else {
        resolve(@{@"status": [self getContactsPermissionStatus], @"alreadyDetermined": @YES});
    }
}

- (NSString *)getContactsPermissionStatus {
    CNAuthorizationStatus status = [CNContactStore authorizationStatusForEntityType:CNEntityTypeContacts];
    switch (status) {
        case CNAuthorizationStatusAuthorized:
            return @"granted";
        case CNAuthorizationStatusDenied:
        case CNAuthorizationStatusRestricted:
            return @"denied";
        case CNAuthorizationStatusNotDetermined:
            return @"not_determined";
        default:
            return @"unknown";
    }
}

// Calendar Permission
- (void)requestCalendarsPermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
    EKAuthorizationStatus status = [EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent];
    
    if (status == EKAuthorizationStatusNotDetermined) {
        EKEventStore *store = [[EKEventStore alloc] init];
        [store requestAccessToEntityType:EKEntityTypeEvent completion:^(BOOL granted, NSError * _Nullable error) {
            dispatch_async(dispatch_get_main_queue(), ^{
                if (error) {
                    reject(@"calendar_error", error.localizedDescription, error);
                } else {
                    resolve(@{@"status": granted ? @"granted" : @"denied"});
                }
            });
        }];
    } else {
        resolve(@{@"status": [self getCalendarsPermissionStatus], @"alreadyDetermined": @YES});
    }
}

- (NSString *)getCalendarsPermissionStatus {
    EKAuthorizationStatus status = [EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent];
    switch (status) {
        case EKAuthorizationStatusAuthorized:
            return @"granted";
        case EKAuthorizationStatusDenied:
        case EKAuthorizationStatusRestricted:
            return @"denied";
        case EKAuthorizationStatusNotDetermined:
            return @"not_determined";
        default:
            return @"unknown";
    }
}

// Reminders Permission
- (void)requestRemindersPermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
    EKAuthorizationStatus status = [EKEventStore authorizationStatusForEntityType:EKEntityTypeReminder];
    
    if (status == EKAuthorizationStatusNotDetermined) {
        EKEventStore *store = [[EKEventStore alloc] init];
        [store requestAccessToEntityType:EKEntityTypeReminder completion:^(BOOL granted, NSError * _Nullable error) {
            dispatch_async(dispatch_get_main_queue(), ^{
                if (error) {
                    reject(@"reminders_error", error.localizedDescription, error);
                } else {
                    resolve(@{@"status": granted ? @"granted" : @"denied"});
                }
            });
        }];
    } else {
        resolve(@{@"status": [self getRemindersPermissionStatus], @"alreadyDetermined": @YES});
    }
}

- (NSString *)getRemindersPermissionStatus {
    EKAuthorizationStatus status = [EKEventStore authorizationStatusForEntityType:EKEntityTypeReminder];
    switch (status) {
        case EKAuthorizationStatusAuthorized:
            return @"granted";
        case EKAuthorizationStatusDenied:
        case EKAuthorizationStatusRestricted:
            return @"denied";
        case EKAuthorizationStatusNotDetermined:
            return @"not_determined";
        default:
            return @"unknown";
    }
}

// Location Permission
- (void)requestLocationWhenInUsePermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
    CLAuthorizationStatus status = [CLLocationManager authorizationStatus];
    
    if (status == kCLAuthorizationStatusNotDetermined) {
        self.locationResolve = resolve;
        self.locationReject = reject;
        [self.locationManager requestWhenInUseAuthorization];
    } else {
        resolve(@{@"status": [self getLocationPermissionStatus], @"alreadyDetermined": @YES});
    }
}

- (void)requestLocationAlwaysPermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
    CLAuthorizationStatus status = [CLLocationManager authorizationStatus];
    
    if (status == kCLAuthorizationStatusNotDetermined || status == kCLAuthorizationStatusAuthorizedWhenInUse) {
        self.locationResolve = resolve;
        self.locationReject = reject;
        [self.locationManager requestAlwaysAuthorization];
    } else {
        resolve(@{@"status": [self getLocationPermissionStatus], @"alreadyDetermined": @YES});
    }
}

- (NSString *)getLocationPermissionStatus {
    CLAuthorizationStatus status = [CLLocationManager authorizationStatus];
    switch (status) {
        case kCLAuthorizationStatusAuthorizedAlways:
            return @"granted_always";
        case kCLAuthorizationStatusAuthorizedWhenInUse:
            return @"granted_when_in_use";
        case kCLAuthorizationStatusDenied:
        case kCLAuthorizationStatusRestricted:
            return @"denied";
        case kCLAuthorizationStatusNotDetermined:
            return @"not_determined";
        default:
            return @"unknown";
    }
}

// CLLocationManagerDelegate
- (void)locationManager:(CLLocationManager *)manager didChangeAuthorizationStatus:(CLAuthorizationStatus)status {
    if (self.locationResolve) {
        self.locationResolve(@{@"status": [self getLocationPermissionStatus]});
        self.locationResolve = nil;
        self.locationReject = nil;
    }
}

// Speech Recognition Permission
- (void)requestSpeechRecognitionPermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
    SFSpeechRecognizerAuthorizationStatus status = [SFSpeechRecognizer authorizationStatus];
    
    if (status == SFSpeechRecognizerAuthorizationStatusNotDetermined) {
        [SFSpeechRecognizer requestAuthorization:^(SFSpeechRecognizerAuthorizationStatus newStatus) {
            dispatch_async(dispatch_get_main_queue(), ^{
                resolve(@{@"status": [self speechRecognitionStatusToString:newStatus]});
            });
        }];
    } else {
        resolve(@{@"status": [self getSpeechRecognitionPermissionStatus], @"alreadyDetermined": @YES});
    }
}

- (NSString *)getSpeechRecognitionPermissionStatus {
    SFSpeechRecognizerAuthorizationStatus status = [SFSpeechRecognizer authorizationStatus];
    return [self speechRecognitionStatusToString:status];
}

- (NSString *)speechRecognitionStatusToString:(SFSpeechRecognizerAuthorizationStatus)status {
    switch (status) {
        case SFSpeechRecognizerAuthorizationStatusAuthorized:
            return @"granted";
        case SFSpeechRecognizerAuthorizationStatusDenied:
        case SFSpeechRecognizerAuthorizationStatusRestricted:
            return @"denied";
        case SFSpeechRecognizerAuthorizationStatusNotDetermined:
            return @"not_determined";
        default:
            return @"unknown";
    }
}

// Media Library Permission
- (void)requestMediaLibraryPermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
    MPMediaLibraryAuthorizationStatus status = [MPMediaLibrary authorizationStatus];
    
    if (status == MPMediaLibraryAuthorizationStatusNotDetermined) {
        [MPMediaLibrary requestAuthorization:^(MPMediaLibraryAuthorizationStatus newStatus) {
            dispatch_async(dispatch_get_main_queue(), ^{
                resolve(@{@"status": [self mediaLibraryStatusToString:newStatus]});
            });
        }];
    } else {
        resolve(@{@"status": [self getMediaLibraryPermissionStatus], @"alreadyDetermined": @YES});
    }
}

- (NSString *)getMediaLibraryPermissionStatus {
    MPMediaLibraryAuthorizationStatus status = [MPMediaLibrary authorizationStatus];
    return [self mediaLibraryStatusToString:status];
}

- (NSString *)mediaLibraryStatusToString:(MPMediaLibraryAuthorizationStatus)status {
    switch (status) {
        case MPMediaLibraryAuthorizationStatusAuthorized:
            return @"granted";
        case MPMediaLibraryAuthorizationStatusDenied:
        case MPMediaLibraryAuthorizationStatusRestricted:
            return @"denied";
        case MPMediaLibraryAuthorizationStatusNotDetermined:
            return @"not_determined";
        default:
            return @"unknown";
    }
}

// Motion Permission
- (void)requestMotionPermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
    // Motion permission doesn't have a request API, just check availability
    resolve(@{@"status": [self getMotionPermissionStatus], @"note": @"Motion permission is determined by availability"});
}

- (NSString *)getMotionPermissionStatus {
    if ([CMMotionActivityManager isActivityAvailable]) {
        return @"granted";
    } else {
        return @"denied";
    }
}

// Face ID Permission
- (void)requestFaceIDPermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
    LAContext *context = [[LAContext alloc] init];
    NSError *error = nil;
    
    if ([context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error]) {
        [context evaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
                localizedReason:@"Use Face ID to authenticate"
                          reply:^(BOOL success, NSError * _Nullable error) {
            dispatch_async(dispatch_get_main_queue(), ^{
                if (success) {
                    resolve(@{@"status": @"granted"});
                } else {
                    resolve(@{@"status": @"denied", @"error": error.localizedDescription ?: @"Authentication failed"});
                }
            });
        }];
    } else {
        resolve(@{@"status": @"not_available", @"error": error.localizedDescription ?: @"Biometric authentication not available"});
    }
}

- (NSString *)getFaceIDPermissionStatus {
    LAContext *context = [[LAContext alloc] init];
    NSError *error = nil;
    
    if ([context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error]) {
        return @"available";
    } else {
        return @"not_available";
    }
}

// App Tracking Transparency Permission
- (void)requestAppTrackingPermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
#if __has_include(<AppTrackingTransparency/AppTrackingTransparency.h>)
    if (@available(iOS 14, *)) {
        ATTrackingManagerAuthorizationStatus status = [ATTrackingManager trackingAuthorizationStatus];
        
        if (status == ATTrackingManagerAuthorizationStatusNotDetermined) {
            [ATTrackingManager requestTrackingAuthorizationWithCompletionHandler:^(ATTrackingManagerAuthorizationStatus newStatus) {
                dispatch_async(dispatch_get_main_queue(), ^{
                    resolve(@{@"status": [self appTrackingStatusToString:newStatus]});
                });
            }];
        } else {
            resolve(@{@"status": [self getAppTrackingPermissionStatus], @"alreadyDetermined": @YES});
        }
    } else {
        resolve(@{@"status": @"not_available", @"note": @"App Tracking Transparency requires iOS 14+"});
    }
#else
    resolve(@{@"status": @"not_available", @"note": @"App Tracking Transparency framework not available"});
#endif
}

- (NSString *)getAppTrackingPermissionStatus {
#if __has_include(<AppTrackingTransparency/AppTrackingTransparency.h>)
    if (@available(iOS 14, *)) {
        ATTrackingManagerAuthorizationStatus status = [ATTrackingManager trackingAuthorizationStatus];
        return [self appTrackingStatusToString:status];
    }
#endif
    return @"not_available";
}

- (NSString *)appTrackingStatusToString:(NSUInteger)status {
#if __has_include(<AppTrackingTransparency/AppTrackingTransparency.h>)
    if (@available(iOS 14, *)) {
        switch (status) {
            case ATTrackingManagerAuthorizationStatusAuthorized:
                return @"granted";
            case ATTrackingManagerAuthorizationStatusDenied:
            case ATTrackingManagerAuthorizationStatusRestricted:
                return @"denied";
            case ATTrackingManagerAuthorizationStatusNotDetermined:
                return @"not_determined";
            default:
                return @"unknown";
        }
    }
#endif
    return @"not_available";
}

@end