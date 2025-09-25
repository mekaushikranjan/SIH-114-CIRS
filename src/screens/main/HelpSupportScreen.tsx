import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const HelpSupportScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const callSupport = () => {
    Linking.openURL('tel:+911234567890');
  };

  const emailSupport = () => {
    Linking.openURL('mailto:support@jharkhand.gov.in');
  };

  const openWhatsApp = () => {
    Linking.openURL('whatsapp://send?phone=+911234567890&text=Hello, I need help with the civic issue app');
  };

  const openWebsite = () => {
    Linking.openURL('https://jharkhand.gov.in');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Support Section */}
        <View style={styles.helpCard}>
          <View style={styles.helpCardHeader}>
            <View style={[styles.helpIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="headset" size={24} color="#1976D2" />
            </View>
            <Text style={styles.helpCardTitle}>{t('helpSupport.contactOptions')}</Text>
          </View>
          <Text style={styles.helpCardSubtitle}>{t('helpSupport.subtitle')}</Text>
          
          <TouchableOpacity style={styles.contactOption} onPress={callSupport}>
            <View style={[styles.contactIcon, { backgroundColor: '#E8F5E8' }]}>
              <Ionicons name="call" size={20} color="#2E7D32" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{t('helpSupport.callSupport')}</Text>
              <Text style={styles.contactSubtitle}>+91 123 456 7890</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contactOption} onPress={emailSupport}>
            <View style={[styles.contactIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="mail" size={20} color="#F57C00" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{t('helpSupport.emailSupport')}</Text>
              <Text style={styles.contactSubtitle}>support@jharkhand.gov.in</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactOption} onPress={openWhatsApp}>
            <View style={[styles.contactIcon, { backgroundColor: '#E8F5E8' }]}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{t('helpSupport.whatsappSupport')}</Text>
              <Text style={styles.contactSubtitle}>{t('helpSupport.whatsappDescription')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactOption} onPress={openWebsite}>
            <View style={[styles.contactIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="globe" size={20} color="#7B1FA2" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{t('helpSupport.website')}</Text>
              <Text style={styles.contactSubtitle}>jharkhand.gov.in</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.helpCard}>
          <View style={styles.helpCardHeader}>
            <View style={[styles.helpIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="help-circle" size={24} color="#7B1FA2" />
            </View>
            <Text style={styles.helpCardTitle}>{t('helpSupport.faq')}</Text>
          </View>
          <Text style={styles.helpCardSubtitle}>{t('helpSupport.faqDescription')}</Text>
          
          <View style={styles.faqContainer}>
            <View style={styles.faqItem}>
              <View style={styles.faqHeader}>
                <Ionicons name="document-text" size={16} color="#2E7D32" />
                <Text style={styles.faqQuestion}>{t('helpSupport.faqQuestions.howToReport')}</Text>
              </View>
              <Text style={styles.faqAnswer}>{t('helpSupport.faqAnswers.howToReport')}</Text>
            </View>
            
            <View style={styles.faqItem}>
              <View style={styles.faqHeader}>
                <Ionicons name="time" size={16} color="#2E7D32" />
                <Text style={styles.faqQuestion}>{t('helpSupport.faqQuestions.howToTrack')}</Text>
              </View>
              <Text style={styles.faqAnswer}>{t('helpSupport.faqAnswers.howToTrack')}</Text>
            </View>
            
            <View style={styles.faqItem}>
              <View style={styles.faqHeader}>
                <Ionicons name="refresh" size={16} color="#2E7D32" />
                <Text style={styles.faqQuestion}>{t('helpSupport.faqQuestions.notResolved')}</Text>
              </View>
              <Text style={styles.faqAnswer}>{t('helpSupport.faqAnswers.notResolved')}</Text>
            </View>

            <View style={styles.faqItem}>
              <View style={styles.faqHeader}>
                <Ionicons name="location" size={16} color="#2E7D32" />
                <Text style={styles.faqQuestion}>{t('helpSupport.faqQuestions.locationAccuracy')}</Text>
              </View>
              <Text style={styles.faqAnswer}>{t('helpSupport.faqAnswers.locationAccuracy')}</Text>
            </View>

            <View style={styles.faqItem}>
              <View style={styles.faqHeader}>
                <Ionicons name="camera" size={16} color="#2E7D32" />
                <Text style={styles.faqQuestion}>{t('helpSupport.faqQuestions.addPhotos')}</Text>
              </View>
              <Text style={styles.faqAnswer}>{t('helpSupport.faqAnswers.addPhotos')}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.helpCard}>
          <View style={styles.helpCardHeader}>
            <View style={[styles.helpIcon, { backgroundColor: '#E8F5E8' }]}>
              <Ionicons name="flash" size={24} color="#2E7D32" />
            </View>
            <Text style={styles.helpCardTitle}>{t('helpSupport.quickActions')}</Text>
          </View>
          <Text style={styles.helpCardSubtitle}>Common tasks and shortcuts</Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="add-circle" size={20} color="#1976D2" />
              </View>
              <Text style={styles.quickActionText}>Report Issue</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E8' }]}>
                <Ionicons name="list" size={20} color="#2E7D32" />
              </View>
              <Text style={styles.quickActionText}>My Issues</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="map" size={20} color="#F57C00" />
              </View>
              <Text style={styles.quickActionText}>View Map</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="settings" size={20} color="#7B1FA2" />
              </View>
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Hours */}
        <View style={styles.helpCard}>
          <View style={styles.helpCardHeader}>
            <View style={[styles.helpIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="time" size={24} color="#F57C00" />
            </View>
            <Text style={styles.helpCardTitle}>Support Hours</Text>
          </View>
          <Text style={styles.helpCardSubtitle}>When you can reach us</Text>
          
          <View style={styles.supportHours}>
            <View style={styles.hoursItem}>
              <Text style={styles.hoursDay}>Monday - Friday</Text>
              <Text style={styles.hoursTime}>9:00 AM - 6:00 PM</Text>
            </View>
            <View style={styles.hoursItem}>
              <Text style={styles.hoursDay}>Saturday</Text>
              <Text style={styles.hoursTime}>10:00 AM - 4:00 PM</Text>
            </View>
            <View style={styles.hoursItem}>
              <Text style={styles.hoursDay}>Sunday</Text>
              <Text style={styles.hoursTime}>Emergency Support Only</Text>
            </View>
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
    padding: 16,
  },
  helpCard: {
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
  helpCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  helpCardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
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
  faqContainer: {
    marginTop: 8,
  },
  faqItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quickActionItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  supportHours: {
    marginTop: 8,
  },
  hoursItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  hoursDay: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  hoursTime: {
    fontSize: 14,
    color: '#666',
  },
});

export default HelpSupportScreen;
