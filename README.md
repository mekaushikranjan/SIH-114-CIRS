# Civic Issue Reporter

A comprehensive mobile application for reporting and tracking civic issues, developed for the Government of Jharkhand. This app enables citizens to report civic problems, track their resolution progress, and engage with their community.

## Features


### 🏠 Home Page
- App branding with Government of Jharkhand identity
- Quick access to report issues
- Browse nearby issues and track personal reports
- Issue categories (Potholes, Garbage, Sanitation, etc.)
- Search functionality for existing issues
- Government announcements section
### 🔐 Authentication
- Email and password login/registration
- OAuth integration (Google) ready for backend implementation
- Role-based access (Citizen/Admin)
- Secure user session management

### 📝 Issue Reporting
- Comprehensive issue submission form
- Category selection with visual icons
- GPS location capture and manual location input
- Photo and video upload capabilities
- Real-time form validation

### 🏛️ Department Pages
- View issues by department/category
- Upvoting system for community engagement
- Issue status tracking with visual indicators
- Filter by status (submitted, acknowledged, in progress, etc.)

### 🌐 Community Features
- AI-powered word cloud of trending issues
- Popular issues ranked by community upvotes
- Community statistics and insights
- Trending topics with trend indicators

### 📊 Personal Reports
- Visual charts showing issue filing trends
- Personal issue history with status tracking
- Performance insights and statistics
- Issue resolution analytics

### 🔍 Issue Tracking
- Detailed timeline view of issue progress
- Status updates with timestamps
- Deadline tracking with alerts
- Department assignment information
- Reminder and notification system

### 🔔 Alerts & Notifications
- Customizable notification preferences
- Real-time alerts for issue updates
- Nearby issue notifications
- Department announcements
- Emergency contact information

### 👤 Profile Management
- User profile with statistics
- Settings for language, theme, and notifications
- Account management features
- App information and support links

## Tech Stack

### Frontend
- **React Native** with **Expo** - Cross-platform mobile development
- **TypeScript** - Type safety and better development experience
- **Redux Toolkit** - State management
- **React Navigation** - Navigation system
- **React Hook Form** - Form handling

### Key Libraries
- `@react-navigation/native` - Navigation
- `@react-navigation/bottom-tabs` - Tab navigation
- `@react-navigation/stack` - Stack navigation
- `react-native-elements` - UI components
- `react-native-vector-icons` - Icons
- `expo-location` - GPS functionality
- `expo-image-picker` - Camera and gallery access
- `expo-camera` - Camera functionality
- `react-native-chart-kit` - Data visualization
- `react-native-maps` - Map integration
- `axios` - HTTP client for API calls

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd civic-issue-reporter
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

4. **Run on device/simulator**
   - For iOS: `npm run ios` or press `i` in the Expo CLI
   - For Android: `npm run android` or press `a` in the Expo CLI
   - For web: `npm run web` or press `w` in the Expo CLI

## Project Structure

```
civic-issue-reporter/
├── src/
│   ├── navigation/          # Navigation configuration
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── screens/            # Screen components
│   │   ├── auth/           # Authentication screens
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   └── main/           # Main app screens
│   │       ├── HomeScreen.tsx
│   │       ├── ComplaintScreen.tsx
│   │       ├── DepartmentScreen.tsx
│   │       ├── CommunityScreen.tsx
│   │       ├── ReportsScreen.tsx
│   │       ├── TrackIssueScreen.tsx
│   │       ├── IssuesScreen.tsx
│   │       ├── AlertsScreen.tsx
│   │       └── ProfileScreen.tsx
│   ├── store/              # Redux store configuration
│   │   ├── store.ts
│   │   └── slices/
│   │       ├── authSlice.ts
│   │       ├── issuesSlice.ts
│   │       └── userSlice.ts
│   └── types/              # TypeScript type definitions
│       └── index.ts
├── App.tsx                 # Root component
├── app.json               # Expo configuration
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## Configuration

### Environment Variables
Create a `.env` file in the root directory for environment-specific configurations:

```env
API_BASE_URL=https://your-backend-api.com
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id
MAPS_API_KEY=your-maps-api-key
```

### Permissions
The app requires the following permissions:
- **Location Access** - For GPS-based issue reporting
- **Camera** - For taking photos of issues
- **Photo Library** - For selecting existing photos
- **Notifications** - For push notifications

## Backend Integration

The app is designed to work with a REST API backend. Key API endpoints expected:

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user info

### Issues
- `GET /issues` - Get all issues (with filters)
- `POST /issues` - Create new issue
- `GET /issues/:id` - Get specific issue
- `PUT /issues/:id` - Update issue
- `POST /issues/:id/upvote` - Upvote an issue

### Departments
- `GET /departments` - Get all departments
- `GET /departments/:id/issues` - Get issues by department

### Notifications
- `GET /notifications` - Get user notifications
- `PUT /notifications/:id/read` - Mark notification as read

## Deployment

### Building for Production

1. **Configure app.json**
   Update the `app.json` file with your app details:
   ```json
   {
     "expo": {
       "name": "Civic Issue Reporter",
       "slug": "civic-issue-reporter",
       "version": "1.0.0",
       "ios": {
         "bundleIdentifier": "com.jharkhand.civicissuereporter"
       },
       "android": {
         "package": "com.jharkhand.civicissuereporter"
       }
     }
   }
   ```

2. **Build the app**
   ```bash
   expo build:android
   expo build:ios
   ```

3. **Publish updates**
   ```bash
   expo publish
   ```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is developed for the Government of Jharkhand. All rights reserved.

## Support

For technical support or questions about the application:
- Email: support@jharkhand.gov.in
- Phone: +91-XXXX-XXXXXX

## Acknowledgments

- Government of Jharkhand for the initiative
- React Native and Expo teams for the excellent framework
- Open source community for the libraries used

---

**Note**: This application is currently in development. Some features may require backend API integration to be fully functional.
