# Installation Steps

1. Navigate to your application folder in the terminal
2. Run: `npm i react-native-nitro-modules`
3. Run: `npm i securiti-consent-sdk@latest`
4. Ensure `node_modules/securiti-consent-sdk` exists

## Android Installation Steps

In your app's `android/app/build.gradle` file, add the following line above the dependencies block:

```gradle
repositories {      
   google()      
   mavenCentral()      
   maven {          
      url 'https://cdn-prod.securiti.ai/consent/maven'      
   }  
}
```

## iOS Installation Steps

In your project's `ios` folder, run the following command:

```bash
pod install
```

## Run app

```bash
npx react-native run-android
```

or

```bash
npx react-native run-ios
```
