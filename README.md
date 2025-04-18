# FDA Mobile App

A mobile application for FDA-1 members to manage memberships, reservations, and club activities.

## Features

- **User Authentication**: Secure login system
- **Member Dashboard**: Overview of membership status and activities
- **Facility Reservations**: Book and manage facility reservations
- **Profile Management**: Update personal information and preferences

## Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer)
- [npm](https://www.npmjs.com/) (v8 or newer)
- [Expo CLI](https://docs.expo.dev/workflow/expo-cli/)
- For iOS development: macOS with Xcode
- For Android development: Android Studio

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Verify installation:
   ```bash
   npm run check
   ```

### Running the App

#### Easy Start (Windows)

Double-click one of the following files:
- `start-app.bat` - Batch file for Windows Command Prompt
- `start-app.ps1` - PowerShell script (right-click and select "Run with PowerShell")

#### Command Line Start

```bash
# Standard start
npm start

# Start with cleared cache (if you're having issues)
npm run clear-cache

# Complete cleanup and start (for stubborn issues)
npm run clean-start

# Start in tunnel mode (for connecting via QR code on different networks)
npm run start-tunnel
```

### Connecting to the Backend

The app is configured to automatically try several ways to connect to the backend:
1. Using environment variable `EXPO_PUBLIC_API_URL` if set
2. Using the developer's local network IP address
3. Using localhost/emulator-specific addresses as fallbacks

The current backend URL is configured in `src/services/api-service.ts`.

## Alternatives to Expo Go

If you're experiencing issues with Expo Go, here are alternative ways to test your app:

### 1. Development Build

Create a custom development build that includes all native code:

```bash
npx expo prebuild          # Creates native iOS and Android projects
npx expo run:android       # Run on Android device/emulator
npx expo run:ios           # Run on iOS simulator/device (macOS only)
```

Benefits:
- Full access to native modules
- Better performance than Expo Go
- More reliable for complex apps

### 2. EAS Build

Use Expo Application Services (EAS) to create development and preview builds:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform android
```

Benefits:
- Cloud-based builds (no need for Android Studio/Xcode)
- Development client with custom native modules
- Better debugging tools

### 3. Native Simulators/Emulators

Run directly on official simulators/emulators:

- **Android Studio Emulator**: Create and run Android virtual devices
- **iOS Simulator** (macOS only): Test on virtual iPhone/iPad devices

Benefits:
- Native debugging tools
- Test on specific device models/OS versions
- No dependency on Expo Go

### 4. Physical Devices via USB

Connect your physical device via USB:

```bash
# For Android
npx expo run:android --device

# For iOS (macOS only)
npx expo run:ios --device
```

Benefits:
- Real-world testing environment
- Test hardware features (camera, sensors)
- Better performance assessment

## Troubleshooting

If you encounter issues starting the app:

1. **Check your installation**:
   ```bash
   npm run check
   ```

2. **Clear caches**:
   ```bash
   npm run clean
   ```

3. **Fix dependency issues**:
   ```bash
   npm run fix-dependencies
   ```

4. **Complete reinstall**:
   ```bash
   rm -rf node_modules
   npm install
   ```

5. **Network issues**:
   - Ensure your backend server is running
   - Check the API URL in `src/services/api-service.ts`
   - Try using tunnel mode: `npm run start-tunnel`

## Development

### Project Structure

- `/src`: Main source code
  - `/components`: Reusable UI components
  - `/contexts`: React Context providers
  - `/screens`: App screens
  - `/services`: API and other services
  - `/utils`: Helper utilities
  - `/navigation`: Navigation configuration
- `/assets`: Images, fonts, and other static assets

### Scripts

- `npm run lint`: Run ESLint to check code quality
- `npm test`: Run tests
- `npm run android`: Start for Android
- `npm run ios`: Start for iOS
- `npm run web`: Start for Web

## License

Proprietary - All rights reserved.
