import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const AboutScreen = () => {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.aboutSection}>
          <View style={styles.appIconContainer}>
            <View style={styles.appIcon}>
              <Ionicons name="shield-checkmark" size={40} color="#2E7D32" />
            </View>
            <Text style={styles.appName}>{t('about.appName')}</Text>
            <Text style={styles.appNameHindi}>{t('about.appNameHindi')}</Text>
          </View>

          <View style={styles.aboutInfo}>
            <Text style={styles.aboutTitle}>{t('about.applicationInfo')}</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('about.version')}</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('about.build')}</Text>
              <Text style={styles.infoValue}>2024.01.15</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('about.platform')}</Text>
              <Text style={styles.infoValue}>React Native & Expo</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('about.developer')}</Text>
              <Text style={styles.infoValue}>{t('about.governmentOfJharkhand')}</Text>
            </View>
          </View>

          <View style={styles.aboutDescription}>
            <Text style={styles.aboutTitle}>{t('about.aboutThisApp')}</Text>
            <Text style={styles.descriptionText}>
              {t('about.appDescription')}
            </Text>
            
            <Text style={styles.featuresTitle}>{t('about.keyFeatures')}</Text>
            <Text style={styles.featureItem}>{t('about.features.reportIssues')}</Text>
            <Text style={styles.featureItem}>{t('about.features.trackStatus')}</Text>
            <Text style={styles.featureItem}>{t('about.features.categorization')}</Text>
            <Text style={styles.featureItem}>{t('about.features.community')}</Text>
            <Text style={styles.featureItem}>{t('about.features.multiLanguage')}</Text>
            <Text style={styles.featureItem}>{t('about.features.emergency')}</Text>
          </View>

          <View style={styles.governmentInfo}>
            <Text style={styles.aboutTitle}>{t('about.governmentOfJharkhand')}</Text>
            <Text style={styles.taglineText}>
              <Ionicons name="diamond-outline" size={14} color="#FFD700" /> {t('about.tagline')} <Ionicons name="diamond-outline" size={14} color="#FFD700" />
            </Text>
            <Text style={styles.missionText}>
              {t('about.mission')}
            </Text>
          </View>

          <View style={styles.copyrightSection}>
            <Text style={styles.copyrightText}>{t('about.copyright')}</Text>
            <Text style={styles.copyrightSubtext}>{t('about.allRightsReserved')}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  aboutSection: {
    padding: 10,
  },
  appIconContainer: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
  },
  appNameHindi: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  aboutInfo: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
  },
  aboutDescription: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 15,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 10,
  },
  featureItem: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 5,
  },
  governmentInfo: {
    backgroundColor: '#E8F5E8',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  taglineText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
  },
  missionText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    lineHeight: 20,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  copyrightText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  copyrightSubtext: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default AboutScreen;
