import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '../../store/store';
import WorkerHeader from '../../components/WorkerHeader';

interface AppInfo {
  version: string;
  buildNumber: string;
  releaseDate: string;
  features: string[];
  developers: {
    name: string;
    role: string;
  }[];
  contact: {
    email: string;
    phone: string;
    website: string;
    address: string;
  };
}

interface AboutAppScreenProps {
  navigation: any;
}

const AboutAppScreen: React.FC<AboutAppScreenProps> = ({ navigation }) => {
  const { token } = useSelector((state: RootState) => state.auth);
  const insets = useSafeAreaInsets();
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  // Mock app information
  const mockAppInfo: AppInfo = {
    version: '1.0.0',
    buildNumber: '2024.01.15',
    releaseDate: '2024-01-15',
    features: [
      'Real-time issue reporting and tracking',
      'Location-based work assignments',
      'Photo and video documentation',
      'Performance analytics and ratings',
      'Offline capability for remote areas',
      'Multi-language support',
      'Push notifications for urgent issues',
      'Work history and progress tracking',
    ],
    developers: [
      { name: 'Development Team', role: 'Full Stack Development' },
      { name: 'UI/UX Team', role: 'Design & User Experience' },
      { name: 'QA Team', role: 'Quality Assurance' },
    ],
    contact: {
      email: 'support@civicreporter.com',
      phone: '+91 123 456 7890',
      website: 'https://civicreporter.com',
      address: 'Smart City Initiative, Ranchi, Jharkhand',
    },
  };

  useEffect(() => {
    fetchAppInfo();
  }, []);

  const fetchAppInfo = async () => {
    try {
      const response = await fetch('http://192.168.29.36:3003/api/v1/app/info', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setAppInfo(data.data);
      } else {
        // Fallback to mock data
        setAppInfo(mockAppInfo);
      }
    } catch (error) {
      console.error('Error fetching app info:', error);
      // Fallback to mock data
      setAppInfo(mockAppInfo);
    }
  };

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link');
    });
  };

  const handleEmailPress = () => {
    const email = appInfo?.contact.email;
    if (email) {
      handleLinkPress(`mailto:${email}?subject=Civic Reporter Worker App Inquiry`);
    }
  };

  const handlePhonePress = () => {
    const phone = appInfo?.contact.phone;
    if (phone) {
      handleLinkPress(`tel:${phone}`);
    }
  };

  const handleWebsitePress = () => {
    const website = appInfo?.contact.website;
    if (website) {
      handleLinkPress(website);
    }
  };

  const renderAppInfo = () => (
    <View style={styles.section}>
      <View style={styles.appIconContainer}>
        <View style={styles.appIcon}>
          <Ionicons name="construct" size={40} color="#FF6B35" />
        </View>
        <Text style={styles.appName}>Civic Reporter Worker</Text>
        <Text style={styles.appTagline}>Empowering Municipal Workers</Text>
      </View>

      <View style={styles.versionInfo}>
        <View style={styles.versionRow}>
          <Text style={styles.versionLabel}>Version:</Text>
          <Text style={styles.versionValue}>{appInfo?.version}</Text>
        </View>
        <View style={styles.versionRow}>
          <Text style={styles.versionLabel}>Build:</Text>
          <Text style={styles.versionValue}>{appInfo?.buildNumber}</Text>
        </View>
        <View style={styles.versionRow}>
          <Text style={styles.versionLabel}>Release Date:</Text>
          <Text style={styles.versionValue}>
            {appInfo?.releaseDate ? new Date(appInfo.releaseDate).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderDescription = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>About This App</Text>
      <Text style={styles.description}>
        Civic Reporter Worker is a comprehensive mobile application designed to streamline 
        municipal work management and improve citizen service delivery. This app empowers 
        ground workers with digital tools to efficiently handle civic issues, track progress, 
        and maintain high service standards.
      </Text>
      
      <Text style={styles.description}>
        Built as part of the Smart City Initiative, this application bridges the gap between 
        citizens and municipal workers, ensuring transparent, efficient, and accountable 
        civic service delivery.
      </Text>
    </View>
  );

  const renderFeatures = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Key Features</Text>
      {appInfo?.features.map((feature, index) => (
        <View key={index} style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.featureText}>{feature}</Text>
        </View>
      ))}
    </View>
  );

  const renderDevelopers = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Development Team</Text>
      {appInfo?.developers.map((developer, index) => (
        <View key={index} style={styles.developerItem}>
          <Ionicons name="person-circle" size={24} color="#FF6B35" />
          <View style={styles.developerInfo}>
            <Text style={styles.developerName}>{developer.name}</Text>
            <Text style={styles.developerRole}>{developer.role}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderContact = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Contact Information</Text>
      
      <TouchableOpacity style={styles.contactItem} onPress={handleEmailPress}>
        <Ionicons name="mail" size={24} color="#FF6B35" />
        <View style={styles.contactInfo}>
          <Text style={styles.contactLabel}>Email Support</Text>
          <Text style={styles.contactValue}>{appInfo?.contact.email}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.contactItem} onPress={handlePhonePress}>
        <Ionicons name="call" size={24} color="#FF6B35" />
        <View style={styles.contactInfo}>
          <Text style={styles.contactLabel}>Phone Support</Text>
          <Text style={styles.contactValue}>{appInfo?.contact.phone}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.contactItem} onPress={handleWebsitePress}>
        <Ionicons name="globe" size={24} color="#FF6B35" />
        <View style={styles.contactInfo}>
          <Text style={styles.contactLabel}>Website</Text>
          <Text style={styles.contactValue}>{appInfo?.contact.website}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>

      <View style={styles.contactItem}>
        <Ionicons name="location" size={24} color="#FF6B35" />
        <View style={styles.contactInfo}>
          <Text style={styles.contactLabel}>Address</Text>
          <Text style={styles.contactValue}>{appInfo?.contact.address}</Text>
        </View>
      </View>
    </View>
  );

  const renderLegalLinks = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Legal & Privacy</Text>
      
      <TouchableOpacity 
        style={styles.legalItem}
        onPress={() => handleLinkPress('https://civicreporter.com/terms')}
      >
        <Ionicons name="document-text" size={20} color="#666" />
        <Text style={styles.legalText}>Terms of Service</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.legalItem}
        onPress={() => handleLinkPress('https://civicreporter.com/privacy')}
      >
        <Ionicons name="shield-checkmark" size={20} color="#666" />
        <Text style={styles.legalText}>Privacy Policy</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.legalItem}
        onPress={() => handleLinkPress('https://civicreporter.com/licenses')}
      >
        <Ionicons name="library" size={20} color="#666" />
        <Text style={styles.legalText}>Open Source Licenses</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        © 2024 Smart City Initiative, Ranchi
      </Text>
      <Text style={styles.footerSubtext}>
        Made with ❤️ for better civic services
      </Text>
    </View>
  );

  if (!appInfo) {
    return (
      <View style={styles.container}>
        <WorkerHeader
          title="About App"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WorkerHeader
        title="About App"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {renderAppInfo()}
        {renderDescription()}
        {renderFeatures()}
        {renderDevelopers()}
        {renderContact()}
        {renderLegalLinks()}
        {renderFooter()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  appIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#fff5f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  versionInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  versionLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  versionValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'justify',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  developerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  developerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  developerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  developerRole: {
    fontSize: 12,
    color: '#666',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactInfo: {
    marginLeft: 12,
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 12,
    color: '#666',
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  legalText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
  },
});

export default AboutAppScreen;
