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
  SafeAreaView,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../store/store';
import { addIssue } from '../../store/slices/issuesSlice';
import { apiService } from '../../services/apiService';
import SuccessTickAnimation from '../../components/SuccessTickAnimation';

const { width } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  icon: string;
}

const ComplaintScreen = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    location: null as any,
    media: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const user = useSelector((state: RootState) => state.auth.user);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await apiService.getCategories();
        if (response.success && response.data) {
          setCategories(response.data);
        } else {
          // Fallback to hardcoded categories if API fails
          setCategories([
            { id: '1', name: 'Roads and Infrastructure', icon: 'construct-outline' },
            { id: '2', name: 'Water Supply', icon: 'water-outline' },
            { id: '3', name: 'Electricity', icon: 'bulb-outline' },
            { id: '4', name: 'Sanitation', icon: 'trash-outline' },
            { id: '5', name: 'Public Safety', icon: 'shield-outline' },
            { id: '6', name: 'Environment', icon: 'leaf-outline' },
            { id: '7', name: 'Healthcare', icon: 'medical-outline' },
            { id: '8', name: 'Education', icon: 'school-outline' },
            { id: '9', name: 'Transportation', icon: 'car-outline' },
            { id: '10', name: 'Other', icon: 'ellipsis-horizontal-outline' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to hardcoded categories
        setCategories([
          { id: '1', name: 'Roads and Infrastructure', icon: 'construct-outline' },
          { id: '2', name: 'Water Supply', icon: 'water-outline' },
          { id: '3', name: 'Electricity', icon: 'bulb-outline' },
          { id: '4', name: 'Sanitation', icon: 'trash-outline' },
          { id: '5', name: 'Public Safety', icon: 'shield-outline' },
          { id: '6', name: 'Environment', icon: 'leaf-outline' },
          { id: '7', name: 'Healthcare', icon: 'medical-outline' },
          { id: '8', name: 'Education', icon: 'school-outline' },
          { id: '9', name: 'Transportation', icon: 'car-outline' },
          { id: '10', name: 'Other', icon: 'ellipsis-horizontal-outline' },
        ]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const subcategories: { [key: string]: string[] } = {
    'Roads and Infrastructure': [
      'Potholes and road damage',
      'Broken footpaths',
      'Missing road signs',
      'Traffic signal issues',
      'Road construction debris',
      'Drainage problems',
      'Street lighting issues',
      'Others'
    ],
    'Water Supply': [
      'No water supply',
      'Low water pressure',
      'Contaminated water',
      'Water leakage',
      'Broken pipelines',
      'Irregular supply',
      'Water quality issues',
      'Others'
    ],
    'Electricity': [
      'Power outage',
      'Flickering lights',
      'Exposed wires',
      'Damaged electrical poles',
      'Street light issues',
      'Electrical safety hazards',
      'Meter problems',
      'Others'
    ],
    'Sanitation': [
      'Garbage collection issues',
      'Overflowing bins',
      'Open waste dumping',
      'Public toilet problems',
      'Drainage blockages',
      'Waste burning',
      'Cleaning staff issues',
      'Others'
    ],
    'Public Safety': [
      'Crime and security',
      'Traffic violations',
      'Accident-prone areas',
      'Missing safety barriers',
      'Emergency services access',
      'Public harassment',
      'Safety equipment missing',
      'Others'
    ],
    'Environment': [
      'Air pollution',
      'Water pollution',
      'Noise pollution',
      'Tree cutting',
      'Waste burning',
      'Industrial emissions',
      'Environmental hazards',
      'Others'
    ],
    'Healthcare': [
      'Hospital access issues',
      'Medical emergency response',
      'Health center problems',
      'Medication availability',
      'Ambulance services',
      'Health awareness',
      'Medical waste disposal',
      'Others'
    ],
    'Education': [
      'School infrastructure',
      'Teacher availability',
      'Educational materials',
      'School safety',
      'Transportation to school',
      'Digital learning access',
      'School maintenance',
      'Others'
    ],
    'Transportation': [
      'Public transport issues',
      'Bus route problems',
      'Transportation safety',
      'Vehicle maintenance',
      'Route connectivity',
      'Transportation costs',
      'Accessibility issues',
      'Others'
    ],
    'Other': [
      'General complaints',
      'Administrative issues',
      'Service delivery problems',
      'Government scheme issues',
      'Documentation problems',
      'Other civic issues',
      'Miscellaneous',
      'Others'
    ],
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted' || locationStatus !== 'granted') {
      Alert.alert('Permissions Required', 'Please grant camera, media, and location permissions to use this feature.');
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      setFormData(prev => ({
        ...prev,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: address[0] ? `${address[0].street}, ${address[0].city}` : 'Unknown location',
        },
      }));
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Could not get current location');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData(prev => ({
        ...prev,
        media: [...prev.media, result.assets[0].uri],
      }));
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 60, // 60 seconds max
    });

    if (!result.canceled) {
      setFormData(prev => ({
        ...prev,
        media: [...prev.media, result.assets[0].uri],
      }));
    }
  };

  const recordVideo = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 60, // 60 seconds max
    });

    if (!result.canceled) {
      setFormData(prev => ({
        ...prev,
        media: [...prev.media, result.assets[0].uri],
      }));
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData(prev => ({
        ...prev,
        media: [...prev.media, result.assets[0].uri],
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.category || !formData.subcategory) {
      Alert.alert('Error', 'Please fill in all required fields including subcategory');
      return;
    }

    if (!formData.location) {
      Alert.alert('Error', 'Please add location information');
      return;
    }

    setLoading(true);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add basic issue data
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('subcategory', formData.subcategory);
      formDataToSend.append('priority', 'MEDIUM');
      
      // Add location data
      formDataToSend.append('latitude', formData.location.lat.toString());
      formDataToSend.append('longitude', formData.location.lng.toString());
      formDataToSend.append('address', formData.location.address);
      formDataToSend.append('city', 'Jharkhand');
      formDataToSend.append('state', 'Jharkhand');
      
      // Add category ID (find the selected category)
      const selectedCategory = categories.find(cat => cat.name === formData.category);
      if (selectedCategory) {
        formDataToSend.append('categoryId', selectedCategory.id.toString());
      } else {
        formDataToSend.append('categoryId', '1'); // Default to first category
      }
      
      // Add media files
      formData.media.forEach((uri, index) => {
        const fileExtension = uri.split('.').pop()?.toLowerCase();
        const mimeType = fileExtension === 'mp4' ? 'video/mp4' : 'image/jpeg';
        
        formDataToSend.append('images', {
          uri: uri,
          type: mimeType,
          name: `issue_media_${index}.${fileExtension}`,
        } as any);
      });

      // Submit to backend API
      const response = await apiService.reportIssue(formDataToSend);
      
      if (response.success && response.data) {
        // Create local issue for Redux store
        const newIssue = {
          id: response.data.issueId,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory,
          location: formData.location,
          media: formData.media.map(uri => ({ uri, type: 'image' as const })),
          status: 'pending' as const,
          upvotes: 0,
          submittedBy: user?.id || '',
          submittedAt: new Date().toISOString(),
          trackingNumber: response.data.trackingNumber,
          department: formData.category,
        };

        dispatch(addIssue(newIssue));
        
        // Show success animation
        setShowSuccessAnimation(true);
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to submit issue');
      }
    } catch (error) {
      console.error('Error submitting issue:', error);
      Alert.alert('Error', 'Failed to submit issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.title || !formData.category || !formData.subcategory) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={styles.progressStepContainer}>
            <View style={[
              styles.progressStep,
              currentStep >= step ? styles.progressStepActive : styles.progressStepInactive
            ]}>
              <Text style={[
                styles.progressStepText,
                currentStep >= step ? styles.progressStepTextActive : styles.progressStepTextInactive
              ]}>
                {step}
              </Text>
            </View>
            {step < 3 && (
              <View style={[
                styles.progressLine,
                currentStep > step ? styles.progressLineActive : styles.progressLineInactive
              ]} />
            )}
          </View>
        ))}
      </View>
      <View style={styles.progressLabels}>
        <Text style={[styles.progressLabel, currentStep === 1 && styles.progressLabelActive]}>
          Issue Details
        </Text>
        <Text style={[styles.progressLabel, currentStep === 2 && styles.progressLabelActive]}>
          Location & Media
        </Text>
        <Text style={[styles.progressLabel, currentStep === 3 && styles.progressLabelActive]}>
          Review & Submit
        </Text>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View>
      {/* Title Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Issue Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Brief title for your issue"
          value={formData.title}
          onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
        />
      </View>

      {/* Category Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Category *</Text>
        <Text style={styles.sectionHint}>Select the main category for your issue</Text>
        <View style={styles.categoryVerticalContainer}>
          {categoriesLoading ? (
            <Text style={styles.loadingText}>Loading categories...</Text>
          ) : (
            categories.map((category, index) => (
              <TouchableOpacity
                key={category.id || index}
                style={[
                  styles.categoryVerticalItem,
                  formData.category === category.name && styles.categoryVerticalItemSelected,
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, category: category.name, subcategory: '' }));
                  setShowSubcategories(true);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.categoryVerticalIconContainer}>
                  <Ionicons 
                    name={category.icon as any} 
                    size={24} 
                    color={formData.category === category.name ? "#FFFFFF" : "#2E7D32"} 
                  />
                </View>
                <Text
                  style={[
                    styles.categoryVerticalText,
                    formData.category === category.name && styles.categoryVerticalTextSelected,
                  ]}
                >
                  {category.name}
                </Text>
                {formData.category === category.name && (
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      {/* Subcategory Selection */}
      {formData.category && (
        <View style={styles.section}>
          <Text style={styles.label}>Subcategory *</Text>
          <Text style={styles.sectionHint}>Choose the specific type of {formData.category.toLowerCase()} issue</Text>
          <View style={styles.subcategoryContainer}>
            {subcategories[formData.category]?.map((subcategory, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.subcategoryChip,
                  formData.subcategory === subcategory && styles.subcategoryChipSelected,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, subcategory }))}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.subcategoryChipText,
                    formData.subcategory === subcategory && styles.subcategoryChipTextSelected,
                  ]}
                >
                  {subcategory}
                </Text>
                {subcategory === 'Others' && (
                  <View style={styles.othersIndicator}>
                    <Ionicons name="add-circle-outline" size={12} color={formData.subcategory === subcategory ? "white" : "#2E7D32"} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Description Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the issue in detail"
          value={formData.description}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          multiline
          numberOfLines={4}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Location *</Text>
        {formData.location ? (
          <View style={styles.locationCard}>
            <Ionicons name="location" size={20} color="#2E7D32" />
            <Text style={styles.locationText}>{formData.location.address}</Text>
            <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, location: null }))}>
              <Ionicons name="close-circle" size={20} color="#f44336" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
            <Ionicons name="location-outline" size={20} color="#2E7D32" />
            <Text style={styles.locationButtonText}>
              {loading ? 'Getting Location...' : 'Get Current Location'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Media Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Photos/Videos (Optional)</Text>
        
        {formData.media.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.mediaContainer}>
              {formData.media.map((uri, index) => (
                <View key={index} style={styles.mediaItem}>
                  <Image source={{ uri }} style={styles.mediaImage} />
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#f44336" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        <View style={styles.mediaButtonsGrid}>
          <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={20} color="#2E7D32" />
            <Text style={styles.mediaButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
            <Ionicons name="image-outline" size={20} color="#2E7D32" />
            <Text style={styles.mediaButtonText}>Choose Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaButton} onPress={recordVideo}>
            <Ionicons name="videocam-outline" size={20} color="#2E7D32" />
            <Text style={styles.mediaButtonText}>Record Video</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaButton} onPress={pickVideo}>
            <Ionicons name="play-outline" size={20} color="#2E7D32" />
            <Text style={styles.mediaButtonText}>Choose Video</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Submitting...' : 'Submit Issue'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderProgressBar()}
      <ScrollView style={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
      </ScrollView>
      
      {/* Success Animation */}
      <SuccessTickAnimation
        visible={showSuccessAnimation}
        onClose={() => {
          setShowSuccessAnimation(false);
          navigation.goBack();
        }}
        message="Issue Submitted Successfully!"
        duration={5000}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryScrollView: {
    marginBottom: 5,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  categoryVerticalContainer: {
    marginBottom: 10,
  },
  categoryVerticalItem: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryVerticalItemSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
    elevation: 6,
    shadowOpacity: 0.25,
  },
  categoryVerticalIconContainer: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderRadius: 20,
    padding: 8,
    marginRight: 12,
  },
  categoryVerticalText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  categoryVerticalTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  categoryEmojiContainer: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderRadius: 15,
    padding: 4,
    marginRight: 6,
  },
  categoryChip: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E8F5E8',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    transform: [{ scale: 1 }],
  },
  categoryChipSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
    elevation: 6,
    shadowOpacity: 0.25,
    transform: [{ scale: 1.05 }],
  },
  categoryChipText: {
    color: '#2E7D32',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  categoryChipTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  subcategoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 8,
    gap: 8,
  },
  subcategoryChip: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E3F2FD',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 6,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  subcategoryChipSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    elevation: 4,
    shadowOpacity: 0.2,
    transform: [{ scale: 1.02 }],
  },
  subcategoryChipText: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  subcategoryChipTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  othersIndicator: {
    marginLeft: 4,
  },
  locationCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  locationText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  locationButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  locationButtonText: {
    marginLeft: 10,
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  mediaContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  mediaItem: {
    position: 'relative',
    marginRight: 10,
  },
  mediaImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  mediaButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mediaButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mediaButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2E7D32',
    marginBottom: 10,
  },
  mediaButtonText: {
    marginLeft: 8,
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    padding: 20,
    backgroundColor: 'white',
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  progressStepActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  progressStepInactive: {
    backgroundColor: 'white',
    borderColor: '#ddd',
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressStepTextActive: {
    color: 'white',
  },
  progressStepTextInactive: {
    color: '#666',
  },
  progressLine: {
    width: 50,
    height: 2,
    marginHorizontal: 10,
  },
  progressLineActive: {
    backgroundColor: '#2E7D32',
  },
  progressLineInactive: {
    backgroundColor: '#ddd',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    flex: 1,
  },
  progressLabelActive: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 20,
  },
});

export default ComplaintScreen;
