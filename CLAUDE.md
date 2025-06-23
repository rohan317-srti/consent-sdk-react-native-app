# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Run
- **Start Metro bundler**: `npm start`
- **Run Android**: `npm run android`
- **Run iOS**: `npm run ios` (requires CocoaPods setup first)
- **Lint code**: `npm run lint`
- **Run tests**: `npm test`

### iOS Setup Commands
Before running iOS for the first time or after updating native dependencies:
```bash
bundle install
bundle exec pod install
```

## Project Architecture

This is a React Native 0.79.3 project that integrates the Securiti Consent SDK for privacy consent management. The app serves as a demo/testing application for the consent SDK functionality.

### Key Components
- **App.tsx**: Main application component that demonstrates all Securiti Consent SDK features including:
  - SDK initialization with platform-specific configuration (different configs for iOS/Android)
  - Consent banner and preference center presentation
  - Purpose and permission consent management
  - SDK configuration retrieval and status checking

### Native Dependencies
- **securiti-consent-sdk**: Main consent management SDK
- **react-native-nitro-modules**: Required for the consent SDK native bridge

### Platform-Specific Configuration
The app uses different SDK configurations for iOS and Android environments, with separate tenant IDs, app IDs, and API endpoints for each platform.

### SDK Integration Pattern
The consent SDK follows an async initialization pattern:
1. Initialize with platform-specific options
2. Wait for SDK ready callback
3. Load initial consent data (purposes and permissions)
4. Present consent UI when appropriate

## Code Style
- Uses ESLint with React Native configuration
- Prettier formatting with specific rules (single quotes, no bracket spacing, trailing commas)
- TypeScript enabled with React Native TypeScript config
- Uses functional components with hooks pattern

## Testing
- Jest with React Native preset
- React Test Renderer for component testing
- Single test file demonstrates basic rendering test pattern