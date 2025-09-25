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

const TermsOfServiceScreen: React.FC = () => {
  const { t } = useTranslation();
  const openEmail = () => {
    Linking.openURL('mailto:legal@jharkhand.gov.in');
  };

  const openWebsite = () => {
    Linking.openURL('https://jharkhand.gov.in/terms');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.termsHeader}>
          <View style={[styles.termsIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="document-text" size={32} color="#1976D2" />
          </View>
          <Text style={styles.termsMainTitle}>{t('termsOfService.title')}</Text>
          <Text style={styles.termsSubtitle}>{t('termsOfService.subtitle')}</Text>
          <Text style={styles.termsDate}>{t('termsOfService.lastUpdated')}</Text>
        </View>

        {/* Introduction */}
        <View style={styles.termsSection}>
          <View style={styles.termsSectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#E8F5E8' }]}>
              <Ionicons name="information-circle" size={20} color="#2E7D32" />
            </View>
            <Text style={styles.termsSectionTitle}>{t('termsOfService.introduction')}</Text>
          </View>
          <Text style={styles.termsSectionText}>
            {t('termsOfService.introText')}
          </Text>
        </View>

        {/* Acceptance of Terms */}
        <View style={styles.termsSection}>
          <View style={styles.termsSectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#F57C00" />
            </View>
            <Text style={styles.termsSectionTitle}>{t('termsOfService.acceptance')}</Text>
          </View>
          <Text style={styles.termsSectionText}>
            {t('termsOfService.acceptanceText')}
          </Text>
        </View>

        {/* Use License */}
        <View style={styles.termsSection}>
          <View style={styles.termsSectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="key" size={20} color="#7B1FA2" />
            </View>
            <Text style={styles.termsSectionTitle}>{t('termsOfService.useLicense')}</Text>
          </View>
          <Text style={styles.termsSectionText}>
            {t('termsOfService.useLicenseText')}
          </Text>
          <View style={styles.termsList}>
            <View style={styles.termsListItem}>
              <Ionicons name="close-circle" size={16} color="#D32F2F" />
              <Text style={styles.termsListText}>{t('termsOfService.useProhibitions.modifyCopy')}</Text>
            </View>
            <View style={styles.termsListItem}>
              <Ionicons name="close-circle" size={16} color="#D32F2F" />
              <Text style={styles.termsListText}>{t('termsOfService.useProhibitions.commercialUse')}</Text>
            </View>
            <View style={styles.termsListItem}>
              <Ionicons name="close-circle" size={16} color="#D32F2F" />
              <Text style={styles.termsListText}>{t('termsOfService.useProhibitions.reverseEngineer')}</Text>
            </View>
            <View style={styles.termsListItem}>
              <Ionicons name="close-circle" size={16} color="#D32F2F" />
              <Text style={styles.termsListText}>{t('termsOfService.useProhibitions.removeNotices')}</Text>
            </View>
          </View>
        </View>

        {/* User Responsibilities */}
        <View style={styles.termsSection}>
          <View style={styles.termsSectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#E8F5E8' }]}>
              <Ionicons name="person" size={20} color="#2E7D32" />
            </View>
            <Text style={styles.termsSectionTitle}>{t('termsOfService.userResponsibilities')}</Text>
          </View>
          <Text style={styles.termsSectionText}>
            {t('termsOfService.userResponsibilitiesIntro')}
          </Text>
          <View style={styles.termsList}>
            <View style={styles.termsListItem}>
              <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
              <Text style={styles.termsListText}>{t('termsOfService.userResponsibilitiesList.accurateInfo')}</Text>
            </View>
            <View style={styles.termsListItem}>
              <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
              <Text style={styles.termsListText}>{t('termsOfService.userResponsibilitiesList.legitimateUse')}</Text>
            </View>
            <View style={styles.termsListItem}>
              <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
              <Text style={styles.termsListText}>{t('termsOfService.userResponsibilitiesList.respectOthers')}</Text>
            </View>
            <View style={styles.termsListItem}>
              <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
              <Text style={styles.termsListText}>{t('termsOfService.userResponsibilitiesList.noFalseReports')}</Text>
            </View>
            <View style={styles.termsListItem}>
              <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
              <Text style={styles.termsListText}>{t('termsOfService.userResponsibilitiesList.accountConfidentiality')}</Text>
            </View>
          </View>
        </View>

        {/* Prohibited Uses */}
        <View style={styles.termsSection}>
          <View style={styles.termsSectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="warning" size={20} color="#D32F2F" />
            </View>
            <Text style={styles.termsSectionTitle}>{t('termsOfService.prohibitedUses')}</Text>
          </View>
          <Text style={styles.termsSectionText}>
            {t('termsOfService.prohibitedUsesIntro')}
          </Text>
          <View style={styles.termsList}>
            <View style={styles.termsListItem}>
              <Ionicons name="close-circle" size={16} color="#D32F2F" />
              <Text style={styles.termsListText}>{t('termsOfService.prohibitedUsesList.unlawful')}</Text>
            </View>
            <View style={styles.termsListItem}>
              <Ionicons name="close-circle" size={16} color="#D32F2F" />
              <Text style={styles.termsListText}>{t('termsOfService.prohibitedUsesList.regulationBreach')}</Text>
            </View>
            <View style={styles.termsListItem}>
              <Ionicons name="close-circle" size={16} color="#D32F2F" />
              <Text style={styles.termsListText}>{t('termsOfService.prohibitedUsesList.ipInfringement')}</Text>
            </View>
            <View style={styles.termsListItem}>
              <Ionicons name="close-circle" size={16} color="#D32F2F" />
              <Text style={styles.termsListText}>{t('termsOfService.prohibitedUsesList.harassment')}</Text>
            </View>
            <View style={styles.termsListItem}>
              <Ionicons name="close-circle" size={16} color="#D32F2F" />
              <Text style={styles.termsListText}>{t('termsOfService.prohibitedUsesList.falseInfo')}</Text>
            </View>
          </View>
        </View>

        {/* Content and Intellectual Property */}
        <View style={styles.termsSection}>
          <View style={styles.termsSectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="shield" size={20} color="#1976D2" />
            </View>
            <Text style={styles.termsSectionTitle}>{t('termsOfService.contentIP')}</Text>
          </View>
          <Text style={styles.termsSectionText}>
            {t('termsOfService.contentIPText')}
          </Text>
          <View style={styles.termsHighlight}>
            <Ionicons name="information" size={16} color="#1976D2" />
            <Text style={styles.termsHighlightText}>{t('termsOfService.contentIPNote')}</Text>
          </View>
        </View>

        {/* Privacy and Data Protection */}
        <View style={styles.termsSection}>
          <View style={styles.termsSectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="lock-closed" size={20} color="#7B1FA2" />
            </View>
            <Text style={styles.termsSectionTitle}>{t('termsOfService.privacyAndData')}</Text>
          </View>
          <Text style={styles.termsSectionText}>
            {t('termsOfService.privacyAndDataText')}
          </Text>
        </View>

        {/* Service Availability */}
        <View style={styles.termsSection}>
          <View style={styles.termsSectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="server" size={20} color="#F57C00" />
            </View>
            <Text style={styles.termsSectionTitle}>{t('termsOfService.serviceAvailability')}</Text>
          </View>
          <Text style={styles.termsSectionText}>
            {t('termsOfService.serviceAvailabilityText')}
          </Text>
        </View>

        {/* Limitation of Liability */}
        <View style={styles.termsSection}>
          <View style={styles.termsSectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="alert-circle" size={20} color="#D32F2F" />
            </View>
            <Text style={styles.termsSectionTitle}>{t('termsOfService.limitationOfLiability')}</Text>
          </View>
          <Text style={styles.termsSectionText}>
            {t('termsOfService.limitationOfLiabilityText')}
          </Text>
        </View>

        {/* Termination */}
        <View style={styles.termsSection}>
          <View style={styles.termsSectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#E8F5E8' }]}>
              <Ionicons name="stop-circle" size={20} color="#2E7D32" />
            </View>
            <Text style={styles.termsSectionTitle}>{t('termsOfService.termination')}</Text>
          </View>
          <Text style={styles.termsSectionText}>
            {t('termsOfService.terminationText')}
          </Text>
        </View>

        {/* Governing Law */}
        <View style={styles.termsSection}>
          <View style={styles.termsSectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="scale" size={20} color="#7B1FA2" />
            </View>
            <Text style={styles.termsSectionTitle}>{t('termsOfService.governingLaw')}</Text>
          </View>
          <Text style={styles.termsSectionText}>
            {t('termsOfService.governingLawText')}
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.termsSection}>
          <View style={styles.termsSectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="call" size={20} color="#1976D2" />
            </View>
            <Text style={styles.termsSectionTitle}>{t('termsOfService.contact')}</Text>
          </View>
          <Text style={styles.termsSectionText}>
            {t('termsOfService.contactIntro')}
          </Text>
          
          <TouchableOpacity style={styles.contactOption} onPress={openEmail}>
            <View style={[styles.contactIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="mail" size={20} color="#1976D2" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{t('termsOfService.contactEmailTitle')}</Text>
              <Text style={styles.contactSubtitle}>{t('termsOfService.contactEmail')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactOption} onPress={openWebsite}>
            <View style={[styles.contactIcon, { backgroundColor: '#E8F5E8' }]}>
              <Ionicons name="globe" size={20} color="#2E7D32" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{t('termsOfService.contactWebsiteTitle')}</Text>
              <Text style={styles.contactSubtitle}>{t('termsOfService.contactWebsite')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Changes to Terms */}
        <View style={styles.termsSection}>
          <View style={styles.termsSectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="refresh" size={20} color="#F57C00" />
            </View>
            <Text style={styles.termsSectionTitle}>{t('termsOfService.changes')}</Text>
          </View>
          <Text style={styles.termsSectionText}>
            {t('termsOfService.changesText')}
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
  termsHeader: {
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
  termsIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  termsMainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  termsSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  termsDate: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  termsSection: {
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
  termsSectionHeader: {
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
  termsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  termsSectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  termsList: {
    marginTop: 8,
  },
  termsListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  termsListText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  termsHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  termsHighlightText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
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

export default TermsOfServiceScreen;
