# React Native Maps Setup Guide

## Installation

To enable the interactive map functionality in the Worker Map Screen, you need to install react-native-maps:

```bash
# Install react-native-maps
npx expo install react-native-maps

# For iOS, you may also need:
npx expo install @react-native-async-storage/async-storage
```

## Configuration

### Android Setup
Add the following to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    }
  }
}
```

### iOS Setup
Add the following to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY"
      }
    }
  }
}
```

## Getting Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API (optional)
4. Create credentials (API Key)
5. Restrict the API key to your app's bundle ID

## Features Enabled

Once installed, the Worker Map Screen will provide:

✅ **Interactive Map View**
- Real-time issue markers with priority-based colors
- User location tracking
- Zoom and pan functionality
- Satellite/terrain view options

✅ **Issue Markers**
- Color-coded by priority (Red: High, Orange: Medium, Green: Low)
- Tap to view issue details
- Callout bubbles with issue information

✅ **Navigation Integration**
- Direct navigation to Google Maps/Apple Maps
- Turn-by-turn directions to issue locations
- Distance calculation from current location

✅ **Real-time Updates**
- Live issue location data from API
- Refresh functionality
- Filter by status and search

## Fallback Mode

If react-native-maps is not installed, the app will show:
- List view of issues with locations
- Distance calculations
- Navigation buttons that open external map apps
- All functionality except the interactive map view

## Testing

After installation, test the map functionality:

1. Grant location permissions when prompted
2. Switch to Map view using the toggle button
3. Verify issue markers appear on the map
4. Test tap-to-navigate functionality
5. Test search and filter functionality
