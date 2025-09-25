import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../services/apiService';
import locationService from '../services/locationService';

interface WorkProgressModalProps {
  visible: boolean;
  assignment: {
    id: string;
    issueId: string;
    issue: {
      title: string;
      location: string;
      category: string;
    } | null;
  } | null;
  onClose: () => void;
  onProgressUpdated: () => void;
}

const WorkProgressModal: React.FC<WorkProgressModalProps> = ({
  visible,
  assignment,
  onClose,
  onProgressUpdated,
}) => {
  const [notes, setNotes] = useState('');
  const [progressPhotos, setProgressPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState('50');
  const insets = useSafeAreaInsets();

  const resetForm = () => {
    setNotes('');
    setProgressPhotos([]);
    setProgressPercentage('50');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery permission is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProgressPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const removePhoto = (index: number) => {
    setProgressPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const submitProgressUpdate = async () => {
    if (!assignment) return;

    if (!notes.trim()) {
      Alert.alert('Required Field', 'Please add progress notes');
      return;
    }

    try {
      setIsSubmitting(true);

      // Get current location
      const currentLocation = await locationService.getCurrentLocationWithRetry(3, 2000);
      
      if (!currentLocation) {
        Alert.alert(
          'Location Required',
          'Location access is required to update progress.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => submitProgressUpdate() }
          ]
        );
        return;
      }

      // Prepare form data for photo uploads
      const formData = new FormData();
      formData.append('notes', notes);
      formData.append('progressPercentage', progressPercentage);
      formData.append('location', JSON.stringify(locationService.createLocationPayload(currentLocation)));

      // Add photos to form data
      progressPhotos.forEach((photoUri, index) => {
        formData.append('progressPhotos', {
          uri: photoUri,
          type: 'image/jpeg',
          name: `progress_${Date.now()}_${index}.jpg`,
        } as any);
      });

      console.log('📸 Submitting progress update for assignment:', assignment.id);

      const response = await apiService.updateWorkProgress(assignment.id, formData);

      if (response.success) {
        Alert.alert(
          'Progress Updated',
          `Work progress updated successfully!\n\nProgress: ${progressPercentage}%\nLocation: ${locationService.formatLocationForDisplay(currentLocation)}`,
          [{ 
            text: 'OK', 
            onPress: () => {
              handleClose();
              onProgressUpdated();
            }
          }]
        );
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      Alert.alert('Error', 'Failed to update progress. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!assignment) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Progress</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Issue Info */}
          <View style={styles.issueInfo}>
            <Text style={styles.issueTitle}>{assignment.issue?.title}</Text>
            <View style={styles.issueDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.detailText}>{assignment.issue?.location}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="folder" size={16} color="#666" />
                <Text style={styles.detailText}>{assignment.issue?.category}</Text>
              </View>
            </View>
          </View>

          {/* Progress Percentage */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress Percentage</Text>
            <View style={styles.progressContainer}>
              <TextInput
                style={styles.progressInput}
                value={progressPercentage}
                onChangeText={setProgressPercentage}
                keyboardType="numeric"
                maxLength={3}
                placeholder="50"
              />
              <Text style={styles.percentageSymbol}>%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(parseInt(progressPercentage) || 0, 100)}%` }
                ]} 
              />
            </View>
          </View>

          {/* Progress Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress Notes *</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Describe the work completed, any challenges faced, or next steps..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Progress Photos */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Progress Photos</Text>
              <TouchableOpacity onPress={selectPhoto} style={styles.addPhotoButton}>
                <Ionicons name="images" size={20} color="#FF6B35" />
                <Text style={styles.addPhotoText}>Select Photo</Text>
              </TouchableOpacity>
            </View>

            {progressPhotos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
                {progressPhotos.map((photo, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <Image source={{ uri: photo }} style={styles.photo} />
                    <TouchableOpacity
                      onPress={() => removePhoto(index)}
                      style={styles.removePhotoButton}
                    >
                      <Ionicons name="close-circle" size={24} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {progressPhotos.length === 0 && (
              <View style={styles.noPhotosContainer}>
                <Ionicons name="camera-outline" size={48} color="#ccc" />
                <Text style={styles.noPhotosText}>No progress photos added</Text>
                <Text style={styles.noPhotosSubtext}>Take photos to document your work progress</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={submitProgressUpdate}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.submitButtonText}>Update Progress</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  issueInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  issueDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: 'center',
    width: 80,
    marginRight: 8,
  },
  percentageSymbol: {
    fontSize: 16,
    color: '#666',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderRadius: 6,
  },
  addPhotoText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  photosContainer: {
    marginTop: 12,
  },
  photoContainer: {
    marginRight: 12,
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  noPhotosContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noPhotosText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  noPhotosSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default WorkProgressModal;
