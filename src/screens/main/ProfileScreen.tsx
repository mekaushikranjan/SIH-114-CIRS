import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Switch,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { RootState } from '../../store/store';
import { logout, updateProfile } from '../../store/slices/authSlice';
import { updatePreferences } from '../../store/slices/userSlice';
import { tokenStorage } from '../../utils/tokenStorage';
import { notificationService } from '../../services/notificationService';
import { apiService } from '../../services/apiService';

const ProfileScreen = ({ route }: { route?: any }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const user = useSelector((state: RootState) => state.auth.user);
  const preferences = useSelector((state: RootState) => state.user.preferences);
  
  const [notifications, setNotifications] = useState(true);
  const [notificationLoading, setNotificationLoading] = useState(false);

  // Fetch current user profile data when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await apiService.getCurrentUser();
        if (response.success && response.data) {
          const userData = (response.data as any).user || (response.data as any);
          dispatch(updateProfile(userData));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [dispatch]);


  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear stored auth data
              await tokenStorage.clearAuthData();
              // Dispatch logout action
              dispatch(logout());
            } catch (error) {
              console.error('Error during logout:', error);
              // Still logout even if clearing storage fails
              dispatch(logout());
            }
          },
        },
      ]
    );
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (!user?.id) {
      Alert.alert(t('common.error'), t('profile.userNotFound'));
      return;
    }

    setNotificationLoading(true);
    
    try {
      if (value) {
        // Register for notifications
        const success = await notificationService.registerForCitizenNotifications(user.id);
        if (success) {
          setNotifications(true);
          Alert.alert(
            t('profile.notificationsEnabled'),
            t('profile.notificationsEnabledMessage')
          );
        } else {
          Alert.alert(
            t('profile.notificationRegistrationFailed'),
            t('profile.notificationRegistrationFailedMessage')
          );
        }
      } else {
        // For now, just disable locally (unregister endpoint would need user ID)
        setNotifications(false);
        Alert.alert(
          t('profile.notificationsDisabled'),
          t('profile.notificationsDisabledMessage')
        );
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert(
        t('common.error'),
        t('profile.notificationUpdateError')
      );
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleLanguageChange = () => {
    console.log('Language change clicked'); // Debug log
    Alert.alert(
      t('profile.selectLanguage'),
      t('profile.chooseLanguage'),
      [
        { 
          text: 'English', 
          onPress: () => {
            console.log('English selected');
            updateLanguage('en');
          }
        },
        { 
          text: 'हिंदी', 
          onPress: () => {
            console.log('Hindi selected');
            updateLanguage('hi');
          }
        },
        { 
          text: 'বাংলা', 
          onPress: () => {
            console.log('Bengali selected');
            updateLanguage('bn');
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const updateLanguage = async (language: 'en' | 'hi' | 'bn') => {
    try {
      await i18n.changeLanguage(language);
      dispatch(updatePreferences({ language }));
      Alert.alert(i18n.t('common.success'), i18n.t('profile.languageChanged'));
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(i18n.t('common.error'), i18n.t('profile.languageChangeError'));
    }
  };



  // Edit profile handler
  const handleEditProfile = () => {
    (navigation as any).navigate('EditProfile');
  };

  // Navigation handlers
  const navigateToMyIssues = () => {
    (navigation as any).navigate('Reports');
  };

  const navigateToHelpSupport = () => {
    (navigation as any).navigate('HelpSupport');
  };

  const navigateToPrivacyPolicy = () => {
    (navigation as any).navigate('PrivacyPolicy');
  };

  const navigateToTermsOfService = () => {
    (navigation as any).navigate('TermsOfService');
  };

  const handleFavorites = () => {
    Alert.alert(t('profile.favorites'), t('profile.favoritesMessage'));
  };


  const navigateToAbout = () => {
    (navigation as any).navigate('About');
  };

  const getLanguageName = (code: string) => {
    switch (code) {
      case 'hi': return 'हिंदी';
      case 'bn': return 'বাংলা';
      default: return 'English';
    }
  };

  const menuItems = [
    {
      icon: 'person',
      iconColor: '#1976D2',
      iconBg: '#E3F2FD',
      title: t('profile.editProfile'),
      subtitle: t('profile.editProfileSubtitle'),
      onPress: handleEditProfile,
    },
    {
      icon: 'document-text',
      iconColor: '#2E7D32',
      iconBg: '#E8F5E8',
      title: t('profile.myIssues'),
      subtitle: t('profile.myIssuesSubtitle'),
      onPress: navigateToMyIssues,
    },
    {
      icon: 'help-circle',
      iconColor: '#F57C00',
      iconBg: '#FFF3E0',
      title: t('profile.help'),
      subtitle: t('profile.helpSupportSubtitle'),
      onPress: navigateToHelpSupport,
    },
    {
      icon: 'information-circle',
      iconColor: '#7B1FA2',
      iconBg: '#F3E5F5',
      title: t('profile.about'),
      subtitle: t('profile.aboutSubtitle'),
      onPress: navigateToAbout,
    },
    {
      icon: 'shield-checkmark',
      iconColor: '#388E3C',
      iconBg: '#E8F5E8',
      title: t('profile.privacyPolicy'),
      subtitle: t('profile.privacyPolicySubtitle'),
      onPress: navigateToPrivacyPolicy,
    },
    {
      icon: 'document',
      iconColor: '#D32F2F',
      iconBg: '#FFEBEE',
      title: t('profile.termsOfService'),
      subtitle: t('profile.termsOfServiceSubtitle'),
      onPress: navigateToTermsOfService,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true}
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('profile.subtitle')}</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            {user?.profilePicture ? (
              <Image 
                source={{ uri: user.profilePicture }} 
                style={styles.avatarImage}
                onError={() => console.log('Profile image failed to load')}
              />
            ) : (
              <Ionicons name="person" size={40} color="white" />
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            <View style={styles.userRole}>
              <Ionicons name="shield-checkmark" size={14} color="#2E7D32" />
              <Text style={styles.roleText}>
                {user?.role === 'admin' ? 'Administrator' : 'Citizen'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="pencil" size={16} color="#2E7D32" />
          </TouchableOpacity>
        </View>



        {/* Settings Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleLanguageChange}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="language" size={20} color="#1976D2" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{t('profile.language')}</Text>
                <Text style={styles.settingSubtitle}>
                  {getLanguageName(preferences.language)}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="notifications" size={20} color="#F57C00" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{t('profile.notifications')}</Text>
                <Text style={styles.settingSubtitle}>
                  {t('profile.notificationsSubtitle')}
                </Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleNotificationToggle}
              disabled={notificationLoading}
              trackColor={{ false: '#767577', true: '#A5D6A7' }}
              thumbColor={notifications ? '#2E7D32' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('profile.accountSupport')}</Text>
          
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          ))}
        </View>


        {/* Logout Button */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.logoutIcon}>
              <Ionicons name="log-out" size={20} color="#f44336" />
            </View>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 Government of Jharkhand
          </Text>
          <Text style={styles.footerSubtext}>
            Civic Issue Reporter - Making cities better together
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
  header: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  userCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userRole: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  roleText: {
    fontSize: 12,
    color: '#2E7D32',
    marginLeft: 4,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
  },
  section: {
    marginBottom: 20,
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 0,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 0,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    marginLeft: 15,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
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
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f44336',
    backgroundColor: '#FFEBEE',
  },
  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFCDD2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginTop: 15,
    marginBottom: 10,
  },
  // Help & Support styles
  helpSection: {
    marginBottom: 30,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  helpOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
  },
  helpOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  // Policy styles
  policyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  policyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  policySubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scrollContent: {
    paddingBottom: 80, // Add padding to show above bottom navigation
  },
});

export default ProfileScreen;
