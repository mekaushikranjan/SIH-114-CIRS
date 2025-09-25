import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const PrivacyPolicyScreen: React.FC = () => {
  const { t } = useTranslation();
  const openEmail = () => {
    Linking.openURL('mailto:privacy@jharkhand.gov.in');
  };

  const openWebsite = () => {
    Linking.openURL('https://jharkhand.gov.in/privacy');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.policyHeader}>
          <View style={[styles.policyIcon, { backgroundColor: '#E8F5E8' }]}>
            <Ionicons name="shield-checkmark" size={32} color="#2E7D32" />
          </View>
          <Text style={styles.policyMainTitle}>{t('privacyPolicy.title')}</Text>
          <Text style={styles.policySubtitle}>{t('privacyPolicy.subtitle')}</Text>
          <Text style={styles.policyDate}>{t('privacyPolicy.lastUpdated')}</Text>
        </View>

        {/* Introduction */}
        <View style={styles.policySection}>
          <View style={styles.policySectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="information-circle" size={20} color="#1976D2" />
            </View>
            <Text style={styles.policySectionTitle}>{t('privacyPolicy.introduction')}</Text>
          </View>
          <Text style={styles.policySectionText}>
            {t('privacyPolicy.introText')}
          </Text>
        </View>

        {/* Data Collection Section */}
        <View style={styles.policySection}>
          <View style={styles.policySectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="document-text" size={20} color="#1976D2" />
            </View>
            <Text style={styles.policySectionTitle}>{t('privacyPolicy.dataCollection')}</Text>
          </View>
          <Text style={styles.policySectionText}>
            {t('privacyPolicy.dataCollectionText')}
          </Text>
          <View style={styles.policyList}>
            <View style={styles.policyListItem}>
              <Ionicons name="location" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.dataItems.location')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="camera" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.dataItems.photos')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="person" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.dataItems.contact')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="time" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.dataItems.details')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="phone-portrait" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.dataItems.device')}</Text>
            </View>
          </View>
        </View>

        {/* Data Usage Section */}
        <View style={styles.policySection}>
          <View style={styles.policySectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="settings" size={20} color="#F57C00" />
            </View>
            <Text style={styles.policySectionTitle}>{t('privacyPolicy.dataUsage')}</Text>
          </View>
          <Text style={styles.policySectionText}>
            {t('privacyPolicy.dataUsageText')}
          </Text>
          <View style={styles.policyList}>
            <View style={styles.policyListItem}>
              <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.usageItems.processing')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="notifications" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.usageItems.communication')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="trending-up" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.usageItems.improvement')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="analytics" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.usageItems.analytics')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="people" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.usageItems.coordination')}</Text>
            </View>
          </View>
          <View style={styles.policyHighlight}>
            <Ionicons name="lock-closed" size={16} color="#2E7D32" />
            <Text style={styles.policyHighlightText}>{t('privacyPolicy.dataProtection')}</Text>
          </View>
        </View>

        {/* Data Security Section */}
        <View style={styles.policySection}>
          <View style={styles.policySectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="shield" size={20} color="#D32F2F" />
            </View>
            <Text style={styles.policySectionTitle}>{t('privacyPolicy.dataSecurity')}</Text>
          </View>
          <Text style={styles.policySectionText}>
            {t('privacyPolicy.securityText')}
          </Text>
          <View style={styles.policyList}>
            <View style={styles.policyListItem}>
              <Ionicons name="lock-closed" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.securityItems.encryption')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="server" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.securityItems.storage')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="eye-off" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.securityItems.access')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="refresh" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.securityItems.audits')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="key" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.securityItems.mfa')}</Text>
            </View>
          </View>
        </View>

        {/* Data Retention Section */}
        <View style={styles.policySection}>
          <View style={styles.policySectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="time" size={20} color="#7B1FA2" />
            </View>
            <Text style={styles.policySectionTitle}>{t('privacyPolicy.dataRetention')}</Text>
          </View>
          <Text style={styles.policySectionText}>
            {t('privacyPolicy.retentionText')}
          </Text>
          <View style={styles.policyList}>
            <View style={styles.policyListItem}>
              <Ionicons name="document" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.retentionItems.reports')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="person" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.retentionItems.accounts')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="analytics" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.retentionItems.analytics')}</Text>
            </View>
          </View>
        </View>

        {/* Your Rights Section */}
        <View style={styles.policySection}>
          <View style={styles.policySectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="person-circle" size={20} color="#7B1FA2" />
            </View>
            <Text style={styles.policySectionTitle}>{t('privacyPolicy.yourRights')}</Text>
          </View>
          <Text style={styles.policySectionText}>
            {t('privacyPolicy.rightsText')}
          </Text>
          <View style={styles.policyList}>
            <View style={styles.policyListItem}>
              <Ionicons name="eye" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.rightsItems.access')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="create" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.rightsItems.update')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="trash" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.rightsItems.delete')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="download" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.rightsItems.portability')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="stop" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.rightsItems.withdraw')}</Text>
            </View>
          </View>
          <View style={styles.policyContact}>
            <Ionicons name="mail" size={16} color="#2E7D32" />
            <Text style={styles.policyContactText}>{t('privacyPolicy.rightsContact')}</Text>
          </View>
        </View>

        {/* Cookies and Tracking */}
        <View style={styles.policySection}>
          <View style={styles.policySectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#E8F5E8' }]}>
              <Ionicons name="finger-print" size={20} color="#2E7D32" />
            </View>
            <Text style={styles.policySectionTitle}>{t('privacyPolicy.cookiesTracking')}</Text>
          </View>
          <Text style={styles.policySectionText}>
            {t('privacyPolicy.cookiesText')}
          </Text>
          <View style={styles.policyList}>
            <View style={styles.policyListItem}>
              <Ionicons name="settings" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.cookiesItems.preferences')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="analytics" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.cookiesItems.analytics')}</Text>
            </View>
            <View style={styles.policyListItem}>
              <Ionicons name="shield" size={16} color="#2E7D32" />
              <Text style={styles.policyListText}>{t('privacyPolicy.cookiesItems.security')}</Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.policySection}>
          <View style={styles.policySectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="call" size={20} color="#F57C00" />
            </View>
            <Text style={styles.policySectionTitle}>{t('privacyPolicy.contactInfo')}</Text>
          </View>
          <Text style={styles.policySectionText}>
            {t('privacyPolicy.contactInfoText')}
          </Text>
          
          <TouchableOpacity style={styles.contactOption} onPress={openEmail}>
            <View style={[styles.contactIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="mail" size={20} color="#1976D2" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{t('privacyPolicy.privacyOfficer')}</Text>
              <Text style={styles.contactSubtitle}>{t('privacyPolicy.privacyEmail')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactOption} onPress={openWebsite}>
            <View style={[styles.contactIcon, { backgroundColor: '#E8F5E8' }]}>
              <Ionicons name="globe" size={20} color="#2E7D32" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{t('privacyPolicy.officialWebsite')}</Text>
              <Text style={styles.contactSubtitle}>{t('privacyPolicy.websiteUrl')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Updates */}
        <View style={styles.policySection}>
          <View style={styles.policySectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="refresh" size={20} color="#7B1FA2" />
            </View>
            <Text style={styles.policySectionTitle}>{t('privacyPolicy.policyUpdates')}</Text>
          </View>
          <Text style={styles.policySectionText}>
            {t('privacyPolicy.updatesText')}
          </Text>
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
    padding: 16,
  },
  policyHeader: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  policyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  policyMainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  policySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  policyDate: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  policySection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  policySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  policySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  policySectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  policyList: {
    marginTop: 8,
  },
  policyListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  policyListText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  policyHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  policyHighlightText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  policyContact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  policyContactText: {
    fontSize: 14,
    color: '#7B1FA2',
    marginLeft: 8,
    flex: 1,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 8,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default PrivacyPolicyScreen;
