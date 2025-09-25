import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  StatusBar,
  SafeAreaView,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import WorkerHeader from '../../components/WorkerHeader';
import notificationService, { NotificationSettings } from '../../services/notificationService';
import { offlineApiService } from '../../services/offlineApiService';
import { updateProfile } from '../../store/slices/authSlice';

interface WorkerProfile {
  id: string;
  workerId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  skills: string[];
  assignedArea: string;
  joiningDate: string;
  status: string;
  profilePhoto?: string;
}

// Removed Performance interface - no longer needed

const WorkerProfileScreen = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [locationEnabled, setLocationEnabled] = useState<boolean>(true);
  const [notificationStatus, setNotificationStatus] = useState<{
    registered: boolean;
    pushToken: string | null;
  }>({ registered: false, pushToken: null });
  // Removed performance state - no longer needed
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  

  useEffect(() => {
    fetchProfile();
  }, []);

  // Refresh profile when screen comes into focus (e.g., after editing profile)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchProfile();
      }
    }, [user?.id])
  );

  const fetchProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('🔍 Fetching worker profile for:', user.id);
      const response = await offlineApiService.getWorkerProfile(user.id);
      console.log('📦 Worker profile API response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        const worker: any = (response as any).data.worker || (response as any).data;
        console.log('👤 Worker data extracted:', JSON.stringify(worker, null, 2));
        
        const profileData = {
          id: worker.id || user.id,
          workerId: worker.workerId || worker.id || user.id,
          name: worker.name || worker.fullName || user.name || 'Unknown',
          email: worker.email || user.email || 'No email',
          phone: worker.phone || worker.phoneNumber || user.phone || 'No phone',
          department: worker.department || user.department || 'Unknown Department',
          skills: worker.skills || [],
          assignedArea: worker.assignedArea || 'Not assigned',
          joiningDate: worker.joiningDate || worker.createdAt || new Date().toISOString(),
          status: worker.status || (worker.isActive ? 'active' : 'inactive') || 'active',
          profilePhoto: worker.profilePhoto || worker.profilePicture || null,
        };
        
        console.log('✅ Setting profile data:', JSON.stringify(profileData, null, 2));
        setProfile(profileData);
        
        // Sync minimal fields into Redux for headers elsewhere
        (dispatch as any)(updateProfile({
          name: profileData.name,
          profilePicture: profileData.profilePhoto,
        }));
      } else {
        console.error('❌ API response failed:', response);
        Alert.alert('Error', (response as any).error?.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('❌ Profile fetch error:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => dispatch(logout())
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        {profile?.profilePhoto ? (
          <Image source={{ uri: profile.profilePhoto }} style={styles.avatarImage} onError={() => setProfile(p => p ? { ...p, profilePhoto: undefined } : p)} />
        ) : (
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#FF6B35" />
          </View>
        )}
        <TouchableOpacity style={styles.editAvatarButton}>
          <Ionicons name="camera" size={16} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>{profile?.name || user?.name}</Text>
        <Text style={styles.profileId}>ID: {profile?.workerId || user?.workerId}</Text>
        <Text style={styles.profileDepartment}>{profile?.department || user?.department}</Text>
        
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>4.2</Text>
          <Text style={styles.ratingText}>Rating</Text>
        </View>
      </View>
    </View>
  );

  // Removed renderPerformanceStats component

  const renderPersonalInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="mail" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile?.email || user?.email}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="call" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{profile?.phone || user?.phone}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="business" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{profile?.department || user?.department}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Assigned Area</Text>
            <Text style={styles.infoValue}>{profile?.assignedArea || user?.assignedArea}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Joining Date</Text>
            <Text style={styles.infoValue}>
              {profile?.joiningDate ? formatDate(profile.joiningDate) : 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Removed renderSkills component

  const renderSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Settings</Text>
      
      <View style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={20} color="#666" />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>Receive alerts for new assignments</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#ccc', true: '#FF6B35' }}
            thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="location" size={20} color="#666" />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Location Services</Text>
              <Text style={styles.settingDescription}>Allow location tracking for work</Text>
            </View>
          </View>
          <Switch
            value={locationEnabled}
            onValueChange={setLocationEnabled}
            trackColor={{ false: '#ccc', true: '#FF6B35' }}
            thumbColor={locationEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => (navigation as any).navigate('EditProfile')}
      >
        <Ionicons name="create" size={20} color="#FF6B35" />
        <Text style={styles.actionButtonText}>Edit Profile</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => (navigation as any).navigate('WorkHistory')}
      >
        <Ionicons name="document-text" size={20} color="#FF6B35" />
        <Text style={styles.actionButtonText}>Work History</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => (navigation as any).navigate('HelpSupport')}
      >
        <Ionicons name="help-circle" size={20} color="#FF6B35" />
        <Text style={styles.actionButtonText}>Help & Support</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => (navigation as any).navigate('AboutApp')}
      >
        <Ionicons name="information-circle" size={20} color="#FF6B35" />
        <Text style={styles.actionButtonText}>About App</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color="#f44336" />
        <Text style={[styles.actionButtonText, styles.logoutText]}>Logout</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Unified header */}
      <WorkerHeader 
        title="Profile" 
        rightComponent={
          <TouchableOpacity onPress={() => (navigation as any).navigate('EditProfile')}>
            <Ionicons name="settings" size={22} color="white" />
          </TouchableOpacity>
        } 
      />

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <>
            {renderProfileHeader()}
            {renderPersonalInfo()}
            {renderSettings()}
            {renderActions()}
          </>
        )}
        
        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Civic Reporter Worker v1.0.0</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  profileHeader: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FF6B35',
    backgroundColor: '#eee',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  profileDepartment: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rating: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
    marginRight: 6,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  // Removed performance stats styles
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  // Removed skills-related styles
  settingsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingContent: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#f44336',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});

export default WorkerProfileScreen;

