import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Animated,
  Easing,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store/store';
import { updateProfile } from '../../store/slices/authSlice';
import { apiService } from '../../services/apiService';
import uploadService from '../../services/uploadService';

const EditProfileScreen = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Initialize form state with a ref to prevent re-initialization
  const [editForm, setEditForm] = useState(() => {
    const initialState = {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: {
        city: (user as any)?.address?.city || '',
        state: (user as any)?.address?.state || '',
        street: (user as any)?.address?.street || '',
        pincode: (user as any)?.address?.pincode || '',
      },
    };
    return initialState;
  });
  
  const [profileImage, setProfileImage] = useState<string | null>(user?.profilePicture || null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // DISABLED: This useEffect was causing form resets
  // Only sync profile image, not form data
  useEffect(() => {
    if (user?.profilePicture && !profileImage) {
      setProfileImage(user.profilePicture);
    }
  }, [user?.profilePicture]);

  // Fetch current user profile data when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await apiService.getCurrentUser();
        if (response.success && response.data) {
          // Update form with fetched data
          const userData = (response.data as any).user || (response.data as any);
          setEditForm({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: {
              city: userData.address?.city || '',
              state: userData.address?.state || '',
              street: userData.address?.street || '',
              pincode: userData.address?.pincode || '',
            },
          });
          
          // Update profile image if available
          if (userData.profilePicture) {
            setProfileImage(userData.profilePicture);
          }
          
          // Update Redux store
          dispatch(updateProfile(response.data));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [dispatch]);

  const saveProfile = async () => {
    // Get current form state directly
    let currentFormData: any = null;
    setEditForm(currentForm => {
      currentFormData = currentForm;
      return currentForm; // Don't change the state
    });
    
    // Wait a tick to ensure state is captured
    await new Promise(resolve => setTimeout(resolve, 0));
    
    if (!currentFormData) {
      console.error('Failed to capture form state');
      return;
    }
    
    // Validate with current form state
    const newErrors: {[key: string]: string} = {};
    
    if (!currentFormData.name.trim()) {
      newErrors.name = t('editProfile.nameRequired');
    }
    
    if (!currentFormData.email.trim()) {
      newErrors.email = t('editProfile.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(currentFormData.email)) {
      newErrors.email = t('editProfile.validEmail');
    }
    
    if (currentFormData.phone && currentFormData.phone.trim() !== '') {
      const cleanPhone = currentFormData.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        newErrors.phone = t('editProfile.phoneRequired');
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert(t('editProfile.validationError'), t('editProfile.fixErrors'));
      return;
    }

    setLoading(true);
    try {
      let uploadedProfileUrl: string | null = null;

      // If a new image is selected, upload it first
      if (profileImage && profileImage !== user?.profilePicture) {
        try {
          const fileName = profileImage.split('/').pop() || 'profile.jpg';
          const fileType = 'image/jpeg';
          const uploadResult = await uploadService.uploadProfileImage({
            uri: profileImage,
            type: fileType,
            name: fileName,
          } as any);

          if (uploadResult?.success && (uploadResult as any).data?.profileImage) {
            uploadedProfileUrl = (uploadResult as any).data.profileImage;
          } else if (uploadResult?.success && (uploadResult as any).optimized_url) {
            // Fallback to optimized_url shape from backend response
            uploadedProfileUrl = (uploadResult as any).optimized_url;
          } else {
            console.warn('Profile image upload failed');
          }
        } catch (uploadError) {
          console.error('Profile image upload error:', uploadError);
          Alert.alert(t('editProfile.uploadError'), t('editProfile.uploadFailed'));
        }
      }

      // Prepare payload with structured address using captured form data
      const payload: any = {
        name: currentFormData.name.trim(),
        phone: currentFormData.phone?.trim() || null,
        address: {
          city: currentFormData.address.city?.trim() || null,
          state: currentFormData.address.state?.trim() || null,
          street: currentFormData.address.street?.trim() || null,
          pincode: currentFormData.address.pincode?.trim() || null,
        },
      };

      if (uploadedProfileUrl) {
        payload.profilePicture = uploadedProfileUrl;
      }

      // Call the API to update profile
      const response = await apiService.updateUserProfile(payload);
      
      if (response.success) {
        // Update Redux store with the response data
        const updatedData = {
          name: response.data?.name || payload.name,
          phone: response.data?.phone || payload.phone,
          address: (response.data as any)?.address || payload.address,
          profilePicture: response.data?.profilePicture || payload.profilePicture || user?.profilePicture,
        };
        
        dispatch(updateProfile(updatedData));
        playSuccessAnimation();
      } else {
        console.error('Profile update failed:', response.error);
        Alert.alert(t('editProfile.updateFailed'), response.error?.message || t('editProfile.updateFailedMessage'));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(t('common.error'), t('editProfile.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const playSuccessAnimation = () => {
    setShowSuccess(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 180,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 180,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowSuccess(false);
          // Navigate back after dismiss
          (navigation as any).goBack();
        });
      }, 900);
    });
  };

  // Set header options
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={saveProfile}
          style={{ padding: 8, opacity: loading ? 0.5 : 1 }}
          disabled={loading}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            {loading ? t('editProfile.saving') : t('editProfile.save')}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, loading, saveProfile]);

  // Profile image picker
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!editForm.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!editForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(editForm.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (editForm.phone && editForm.phone.trim() !== '') {
      const cleanPhone = editForm.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Profile Image Section */}
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.imagePickerContainer} onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.imagePickerCircle}>
                <Ionicons name="camera" size={24} color="#2E7D32" />
                <Text style={styles.imagePickerText}>{t('editProfile.changePhoto')}</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.imageHint}>{t('editProfile.profilePicture')}</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('editProfile.name')} *</Text>
            <TextInput
              style={[styles.formInput, errors.name && styles.formInputError]}
              value={editForm.name}
              onChangeText={(text) => {
                setEditForm(prev => ({ ...prev, name: text }));
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder={t('editProfile.namePlaceholder')}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('editProfile.email')} *</Text>
            <TextInput
              style={[styles.formInput, errors.email && styles.formInputError]}
              value={editForm.email}
              onChangeText={(text) => {
                setEditForm(prev => ({ ...prev, email: text }));
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
              }}
              placeholder={t('editProfile.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false} // Email usually shouldn't be editable
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('editProfile.phone')}</Text>
            <TextInput
              style={[styles.formInput, errors.phone && styles.formInputError]}
              value={editForm.phone}
              onChangeText={(text) => {
                setEditForm(prev => ({ ...prev, phone: text }));
                if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
              }}
              placeholder={t('editProfile.phonePlaceholder')}
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('editProfile.street')}</Text>
            <TextInput
              style={styles.formInput}
              value={editForm.address.street}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, address: { ...prev.address, street: text } }))}
              placeholder={t('editProfile.streetPlaceholder')}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.formLabel}>{t('editProfile.city')}</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.address.city}
                onChangeText={(text) => {
                  setEditForm(prev => ({ ...prev, address: { ...prev.address, city: text } }));
                }}
                placeholder={t('editProfile.cityPlaceholder')}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.formLabel}>{t('editProfile.state')}</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.address.state}
                onChangeText={(text) => {
                  setEditForm(prev => ({ ...prev, address: { ...prev.address, state: text } }));
                }}
                placeholder={t('editProfile.statePlaceholder')}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('editProfile.pincode')}</Text>
            <TextInput
              style={styles.formInput}
              value={editForm.address.pincode}
              onChangeText={(text) => {
                setEditForm(prev => ({ ...prev, address: { ...prev.address, pincode: text } }));
              }}
              placeholder={t('editProfile.pincodePlaceholder')}
              keyboardType="number-pad"
            />
          </View>

        </View>
      </ScrollView>
      {showSuccess && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              styles.successContainer,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark" size={28} color="#fff" />
            </View>
            <Text style={styles.successTitle}>{t('editProfile.profileUpdated')}</Text>
            <Text style={styles.successSubtitle}>Your changes have been saved</Text>
          </Animated.View>
        </View>
      )}
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
  },
  imageSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  imagePickerContainer: {
    alignItems: 'center',
  },
  imagePickerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2E7D32',
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 5,
    textAlign: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  imageHint: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  formSection: {
    backgroundColor: 'white',
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  formInputError: {
    borderColor: '#ff4444',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  successContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '40%',
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  successIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b1b1b',
  },
  successSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#5a5a5a',
  },
});

export default EditProfileScreen;
