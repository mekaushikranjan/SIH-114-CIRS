import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokenStorage } from '../utils/tokenStorage';
import { getCurrentConfig } from '../config/environment';
import AnimatedSuccessModal from './AnimatedSuccessModal';

const { width } = Dimensions.get('window');

interface EndWorkModalProps {
  visible: boolean;
  onClose: () => void;
  onWorkCompleted: () => void;
  workerId: string;
  issueId: string;
}

const EndWorkModal: React.FC<EndWorkModalProps> = ({
  visible,
  onClose,
  onWorkCompleted,
  workerId,
  issueId,
}) => {
  const insets = useSafeAreaInsets();
  const [beforeImages, setBeforeImages] = useState<string[]>([]);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const [workNotes, setWorkNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const pickImageFromGallery = async (type: 'before' | 'after') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery access permission is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        if (type === 'before') {
          setBeforeImages(prev => [...prev, imageUri]);
        } else {
          setAfterImages(prev => [...prev, imageUri]);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const removeImage = (type: 'before' | 'after', index: number) => {
    if (type === 'before') {
      setBeforeImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setAfterImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Helper function to convert image URI to base64
  const convertImageToBase64 = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  };

  const submitWorkCompletion = async () => {
    if (beforeImages.length === 0 || afterImages.length === 0) {
      Alert.alert('Photos Required', 'Please select at least one before and one after photo from your gallery.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      
      // Convert images to base64
      console.log('🔄 Converting images to base64...');
      const beforeImagesBase64 = await Promise.all(
        beforeImages.map(async (uri, index) => {
          const base64 = await convertImageToBase64(uri);
          return {
            url: base64,
            filename: `before-${index}.jpg`,
            caption: 'Before work photo',
            location: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            }
          };
        })
      );

      const afterImagesBase64 = await Promise.all(
        afterImages.map(async (uri, index) => {
          const base64 = await convertImageToBase64(uri);
          return {
            url: base64,
            filename: `after-${index}.jpg`,
            caption: 'After work photo',
            location: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            }
          };
        })
      );

      console.log('✅ Images converted to base64');
      
      // Prepare image data for upload
      const config = getCurrentConfig();
      const response = await fetch(`${config.BASE_URL}/work-progress/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await tokenStorage.getToken()}`,
        },
        body: JSON.stringify({
          sessionId: `session-${issueId}`, // Use issue ID in session format
          notes: workNotes,
          beforeImages: beforeImagesBase64,
          afterImages: afterImagesBase64
        })
      });

      const result = await response.json();

      if (result.success) {
        // Show animated success modal instead of basic alert
        setShowSuccessModal(true);
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to complete work session');
      }
    } catch (error) {
      console.error('Error completing work:', error);
      Alert.alert('Error', 'Failed to complete work session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onWorkCompleted();
    onClose();
  };

  const renderImageSection = (title: string, images: string[], type: 'before' | 'after') => (
    <View style={styles.imageSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
        {images.map((uri, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(type, index)}
            >
              <Ionicons name="close-circle" size={24} color="#ff4444" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={styles.addImageButton}
          onPress={() => pickImageFromGallery(type)}
        >
          <Ionicons name="images" size={32} color="#FF6B35" />
          <Text style={styles.addImageText}>Pick Image</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <>
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Complete Work</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.issueInfo}>
            <Text style={styles.issueTitle}>Complete Work Assignment</Text>
            <Text style={styles.instruction}>
              Please select before and after photos of your work from your gallery, then add any notes about the completion.
            </Text>
          </View>

          {renderImageSection('Before Photos', beforeImages, 'before')}
          {renderImageSection('After Photos', afterImages, 'after')}

          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Work Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes about the work completed..."
              multiline
              numberOfLines={4}
              value={workNotes}
              onChangeText={setWorkNotes}
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={submitWorkCompletion}
            disabled={isSubmitting}
          >
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Completing...' : 'Complete Work'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* Animated Success Modal */}
    <AnimatedSuccessModal
      visible={showSuccessModal}
      onClose={handleSuccessModalClose}
      title="Work Completed! 🎉"
      message="Your work has been successfully submitted and recorded."
    />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  issueInfo: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  imageSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  imageScroll: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 10,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    fontSize: 10,
    color: '#FF6B35',
    marginTop: 4,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  footer: {
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EndWorkModal;
