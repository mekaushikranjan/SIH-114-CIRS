import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '../../store/store';
import WorkerHeader from '../../components/WorkerHeader';
import { offlineApiService } from '../../services/offlineApiService';
import uploadService from '../../services/uploadService';
import { updateProfile } from '../../store/slices/authSlice';

interface EditProfileData {
  name: string;
  email: string;
  phone: string;
  profilePhoto?: string;
  address?: any;
  emergencyContact?: string;
  emergencyPhone?: string;
}

interface EditProfileScreenProps {
  navigation: any;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState<EditProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    profilePhoto: undefined,
    address: { city: '', state: '', street: '', pincode: '' },
    emergencyContact: '',
    emergencyPhone: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  useEffect(() => {
    // Fetch current profile data
    fetchCurrentProfile();
  }, []);

  const fetchCurrentProfile = async () => {
    if (!user?.id) return;

    setFetchingProfile(true);
    try {
      console.log('📋 Fetching current profile for editing...');
      const response = await offlineApiService.getWorkerProfile(user.id);
      console.log('📦 Edit Profile API response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        const worker = (response as any).data.worker || (response as any).data;
        console.log('👤 Edit Profile worker data:', JSON.stringify(worker, null, 2));
        
        const profileData = {
          name: worker.name || worker.fullName || user?.name || '',
          email: worker.email || user?.email || '',
          phone: worker.phone || worker.phoneNumber || user?.phone || '',
          profilePhoto: worker.profilePhoto || worker.profilePicture || undefined,
          address: worker.address || { city: '', state: '', street: '', pincode: '' },
          emergencyContact: worker.emergencyContact || '',
          emergencyPhone: worker.emergencyPhone || '',
        };
        
        console.log('✅ Setting edit form data:', JSON.stringify(profileData, null, 2));
        setFormData(profileData);
        
        if ((response as any).fromCache) {
          console.log('📱 Using cached profile data for editing');
        }
      } else {
        console.log('⚠️ Failed to fetch profile data:', response);
        Alert.alert('Error', 'Failed to load profile data');
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    setLoading(true);
    try {
      console.log('💾 Saving profile changes...');
      
      const profileData = {
        fullName: formData.name,
        phoneNumber: formData.phone,
        profilePicture: formData.profilePhoto,
        address: {
          city: formData.address?.city || '',
          state: formData.address?.state || '',
          street: formData.address?.street || '',
          pincode: formData.address?.pincode || '',
        },
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
      };

      // If profilePhoto is a local URI, upload it first
      if (formData.profilePhoto && formData.profilePhoto.startsWith('file:')) {
        try {
          const uploadResp = await uploadService.uploadProfileImage({
            uri: formData.profilePhoto,
            type: 'image/jpeg',
            name: 'profile.jpg',
          });
          if (uploadResp.success && (uploadResp.data?.optimized_url || uploadResp.data?.profileImage)) {
            const rawUrl = uploadResp.data.optimized_url || uploadResp.data.profileImage;
            profileData.profilePicture = (rawUrl || '').toString().trim();
          }
        } catch (e) {
          console.log('⚠️ Profile image upload failed, proceeding without changing image');
        }
      }

      const response = await offlineApiService.updateWorkerProfile(user.id, profileData);
      
      if (response.success) {
        // Update auth store so headers update across the app
        try {
          dispatch(updateProfile({
            name: profileData.fullName,
            phone: profileData.phoneNumber,
            profilePicture: profileData.profilePicture,
            address: profileData.address,
          }));
        } catch {}
        const message = (response as any).offline 
          ? 'Profile changes saved offline and will sync when online'
          : 'Profile updated successfully';
          
        Alert.alert('Success', message, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        console.error('❌ Profile update failed');
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    Alert.alert(
      'Select Photo',
      'Choose how you want to select a photo',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, profilePhoto: result.assets[0].uri }));
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, profilePhoto: result.assets[0].uri }));
    }
  };

  // Removed skills-related functions

  return (
    <View style={styles.container}>
      <WorkerHeader
        title="Edit Profile"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={fetchCurrentProfile} disabled={fetchingProfile}>
            {fetchingProfile ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="refresh" size={22} color="white" />
            )}
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {fetchingProfile ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Loading profile data...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
          >
          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoContainer} onPress={handleImagePicker}>
              {formData.profilePhoto ? (
                <Image source={{ uri: formData.profilePhoto }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.placeholderPhoto}>
                  <Ionicons name="person" size={40} color="#FF6B35" />
                </View>
              )}
              <View style={styles.photoEditButton}>
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={styles.photoHint}>Tap to change profile photo</Text>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            {/* Address fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.textInput}
                value={formData.address?.city || ''}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address: { ...prev.address, city: text } }))}
                placeholder="City"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.textInput}
                value={formData.address?.state || ''}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address: { ...prev.address, state: text } }))}
                placeholder="State"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Street</Text>
              <TextInput
                style={styles.textInput}
                value={formData.address?.street || ''}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address: { ...prev.address, street: text } }))}
                placeholder="Street"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pincode</Text>
              <TextInput
                style={styles.textInput}
                value={formData.address?.pincode || ''}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address: { ...prev.address, pincode: text } }))}
                placeholder="Pincode"
                placeholderTextColor="#999"
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Emergency Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Name</Text>
              <TextInput
                style={styles.textInput}
                value={formData.emergencyContact}
                onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyContact: text }))}
                placeholder="Emergency contact name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Phone</Text>
              <TextInput
                style={styles.textInput}
                value={formData.emergencyPhone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyPhone: text }))}
                placeholder="Emergency contact phone"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Removed Skills Section */}
          {/* Save Button */}
          <View style={[styles.section, { paddingVertical: 8 }]}>
            <TouchableOpacity
              style={[styles.saveCta, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Ionicons name="save" size={18} color="#fff" />
              <Text style={styles.saveButton}> {loading ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  saveButton: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveCta: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  placeholderPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  photoEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  photoHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  // Removed all skills-related styles
  // Removed more skills-related styles
  // Removed skills-related styles
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

export default EditProfileScreen;
