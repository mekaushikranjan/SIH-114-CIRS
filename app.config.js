export default {
  expo: {
    name: "Civic Issue Reporter",
    slug: "civic-issue-reporter",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      backgroundColor: "#f0f7f0"
    },
    icon: {
      image: "./assets/Jharkhand_Rajakiya_Chihna.png",
      backgroundColor: "#f0f7f0",
      resizeMode: "contain"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.jharkhand.civicissuereporter",
      googleServicesFile: "./GoogleService-Info.plist",
      splash: {
        backgroundColor: "#f0f7f0"
      },
      infoPlist: {
        NSCameraUsageDescription: "This app needs access to camera to take photos and record videos for issue reporting.",
        NSMicrophoneUsageDescription: "This app needs access to microphone to record audio with videos and convert speech to text for issue descriptions.",
        NSSpeechRecognitionUsageDescription: "This app needs access to speech recognition to convert your voice to text for issue descriptions.",
        NSLocationWhenInUseUsageDescription: "This app needs access to location to automatically capture the location of reported issues.",
        UIBackgroundModes: ["background-fetch", "background-processing"]
      }
    },
    android: {
      package: "com.jharkhand.civicissuereporter",
      googleServicesFile: "./google-services.json",
      splash: {
        backgroundColor: "#f0f7f0"
      },
      adaptiveIcon: {
        foregroundImage: "./assets/Jharkhand_Rajakiya_Chihna.png",
        backgroundColor: "#f0f7f0"
      },
      navigationBar: {
        backgroundColor: "#f0f7f0",
        barStyle: "dark-content"
      },
      statusBar: {
        backgroundColor: "#f0f7f0",
        barStyle: "dark-content"
      },
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "RECORD_AUDIO"
      ],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "civicreporter",
            }
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    plugins: [
      "expo-location",
      "expo-camera",
      "expo-image-picker",
      "expo-font",
      "@react-native-voice/voice"
    ],
    scheme: "civicreporter",
    extra: {
      apiBaseUrl: "http://192.168.29.36:3003/api/v1",
      wsUrl: "ws://192.168.29.36:3003/ws",
      firebase: {
        apiKey: "AIzaSyDjLrE-JAgje8cwT0ksXnqAoE716uKlZWo",
        authDomain: "civicissues-9d991.firebaseapp.com",
        projectId: "civicissues-9d991",
        storageBucket: "civicissues-9d991.firebasestorage.app",
        messagingSenderId: "302174900155",
        appId: "1:302174900155:web:71827f13d610ffefd8fe9e",
        measurementId: "G-ER5SZY33ET",
        // Web client ID - for expo-auth-session
        googleWebClientId: "302174900155-dl80f8n8olofv9q5td3o3k7nc6q3vk6q.apps.googleusercontent.com",
        // iOS client ID - from GoogleService-Info.plist
        iosClientId: "302174900155-nrt855evg2e8ck62e5mqutcjmr4drj30.apps.googleusercontent.com",
        // Android client ID - from google-services.json
        androidClientId: "302174900155-lj2im9sqml8t8qhtthbgpusi9fdugam0.apps.googleusercontent.com"
      }
    }
  }
};