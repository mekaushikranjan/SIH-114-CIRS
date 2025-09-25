import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import uploadService from '../../services/uploadService';
import timeTrackingService, { TimeEntry } from '../../services/timeTrackingService';
import { tokenStorage } from '../../utils/tokenStorage';

const { width } = Dimensions.get('window');

interface WorkSession {
  id: string;
  issueId: string;
  issueTitle: string;
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
  status: 'active' | 'paused' | 'completed';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  photos: string[];
  notes: string[];
  breaks: Array<{
    startTime: string;
    endTime?: string;
    reason: string;
  }>;
}

const WorkProgressScreen = ({ route, navigation }: any) => {
  const { assignmentId } = route.params;
  const { user, token } = useSelector((state: RootState) => state.auth);
  
  const [workSession, setWorkSession] = useState<WorkSession | null>(null);
  const [timeEntry, setTimeEntry] = useState<TimeEntry | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [realTimeDuration, setRealTimeDuration] = useState(0);
  const [newNote, setNewNote] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakReason, setBreakReason] = useState('');

  // Mock data for demo
  const mockWorkSession: WorkSession = {
    id: 'session-001',
    issueId: 'issue-001',
    issueTitle: 'Pothole Repair on Main Street',
    startTime: '2024-01-16T08:00:00Z',
    duration: 120, // 2 hours
    status: 'active',
    location: {
      latitude: 23.3441,
      longitude: 85.3096,
      address: 'Main Street, Ranchi'
    },
    photos: ['progress1.jpg', 'progress2.jpg'],
    notes: ['Started excavation', 'Prepared asphalt mix'],
    breaks: [
      {
        startTime: '2024-01-16T09:30:00Z',
        endTime: '2024-01-16T09:45:00Z',
        reason: 'Tea break'
      }
    ]
  };

  useEffect(() => {
    fetchWorkSession();
    initializeTimeTracking();
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      updateRealTimeDuration();
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const initializeTimeTracking = async () => {
    if (!user?.id) return;
    
    try {
      // Check if there's an active time entry for this worker
      const activeEntry = await timeTrackingService.getActiveTimeEntry(user.id);
      if (activeEntry && activeEntry.assignmentId === assignmentId) {
        setTimeEntry(activeEntry);
        console.log('Found active time entry:', activeEntry);
      }
    } catch (error) {
      console.error('Error initializing time tracking:', error);
    }
  };

  const updateRealTimeDuration = () => {
    if (timeEntry && (timeEntry.status === 'active' || timeEntry.status === 'paused')) {
      const duration = timeTrackingService.getCurrentDuration(timeEntry);
      setRealTimeDuration(duration);
    }
  };

  const fetchWorkSession = async () => {
    try {
      // For demo, using mock data
      setWorkSession(mockWorkSession);
    } catch (error) {
      console.error('Error fetching work session:', error);
      Alert.alert('Error', 'Failed to load work session');
    }
  };

  const pauseWork = () => {
    Alert.alert(
      'Pause Work',
      'Why are you pausing work?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Break', onPress: () => setShowBreakModal(true) },
        { text: 'Material Issue', onPress: () => pauseWithReason('Material Issue') },
        { text: 'Equipment Issue', onPress: () => pauseWithReason('Equipment Issue') },
        { text: 'Other', onPress: () => setShowBreakModal(true) }
      ]
    );
  };

  const pauseWithReason = async (reason: string) => {
    if (!timeEntry) return;
    
    try {
      const updatedEntry = await timeTrackingService.pauseTimeTracking(timeEntry.id, reason);
      if (updatedEntry) {
        setTimeEntry(updatedEntry);
        setWorkSession(prev => prev ? { ...prev, status: 'paused' } : null);
        Alert.alert('Work Paused', `Work paused: ${reason}`);
      }
    } catch (error) {
      console.error('Error pausing work:', error);
      Alert.alert('Error', 'Failed to pause work');
    }
  };

  const resumeWork = async () => {
    if (!timeEntry) return;
    
    try {
      const updatedEntry = await timeTrackingService.resumeTimeTracking(timeEntry.id);
      if (updatedEntry) {
        setTimeEntry(updatedEntry);
        setWorkSession(prev => prev ? { ...prev, status: 'active' } : null);
        Alert.alert('Work Resumed', 'Work has been resumed');
      }
    } catch (error) {
      console.error('Error resuming work:', error);
      Alert.alert('Error', 'Failed to resume work');
    }
  };

  const completeWork = () => {
    Alert.alert(
      'Complete Work',
      'Are you sure you want to complete this work session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            if (timeEntry) {
              try {
                const completedEntry = await timeTrackingService.completeTimeTracking(timeEntry.id);
                if (completedEntry) {
                  const totalDuration = timeTrackingService.formatDuration(completedEntry.duration || 0);
                  const workDuration = timeTrackingService.formatDuration(
                    (completedEntry.duration || 0) - completedEntry.pausedDuration
                  );
                  
                  Alert.alert(
                    'Work Completed', 
                    `Work session completed successfully!\n\nTotal Time: ${totalDuration}\nWork Time: ${workDuration}`,
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                  );
                }
              } catch (error) {
                console.error('Error completing work:', error);
                Alert.alert('Error', 'Failed to complete work session');
              }
            } else {
              navigation.goBack();
            }
          }
        }
      ]
    );
  };

  const selectPhoto = async () => {
    try {
      // Request media library permissions for gallery access
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery permission is required to select photos');
        return;
      }

      // Directly open gallery instead of showing options
      await openGallery();
    } catch (error) {
      console.error('Gallery permission error:', error);
      Alert.alert('Error', 'Failed to request gallery permission');
    }
  };

  // Removed openCamera function - now only using gallery

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const uploadPhoto = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      if (!workSession || !token) return;

      // Get current location
      let location = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const currentLocation = await Location.getCurrentPositionAsync({});
          location = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            timestamp: new Date().toISOString()
          };
        }
      } catch (locationError) {
        console.log('Location error:', locationError);
      }

      // Prepare file for upload
      const file = uploadService.prepareFileForUpload(
        asset.uri,
        asset.type || 'image/jpeg',
        `progress_${Date.now()}.jpg`
      );

      // Validate file
      const validation = uploadService.validateFile({
        ...file,
        size: asset.fileSize
      });

      if (!validation.valid) {
        Alert.alert('Invalid File', validation.error || 'File validation failed');
        return;
      }

      // Upload file
      const response = await uploadService.uploadWorkProgressMedia(
        workSession.id,
        [file],
        'Progress photo uploaded',
        location,
        token
      );

      if (response.success) {
        // Update local state
        const newPhoto = response.data?.uploadedFiles[0]?.filename || `progress_${Date.now()}.jpg`;
        setWorkSession(prev => prev ? {
          ...prev,
          photos: [...prev.photos, newPhoto]
        } : null);
        
        Alert.alert('Success', 'Photo uploaded successfully');
      } else {
        // Don't show alert for permission errors - user will be automatically logged out
        if (response.error?.code !== 'HTTP_403') {
          Alert.alert('Upload Failed', response.error?.message || 'Failed to upload photo');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !workSession || !token) return;
    
    try {
      // Get current location
      let location = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const currentLocation = await Location.getCurrentPositionAsync({});
          location = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            timestamp: new Date().toISOString()
          };
        }
      } catch (locationError) {
        console.log('Location error:', locationError);
      }

      // Upload note
      const response = await uploadService.addWorkNote(
        workSession.id,
        newNote.trim(),
        location,
        token
      );

      if (response.success) {
        // Update local state
        setWorkSession(prev => prev ? {
          ...prev,
          notes: [...prev.notes, `${new Date().toLocaleTimeString()}: ${newNote}`]
        } : null);
        
        setNewNote('');
        setShowAddNote(false);
        Alert.alert('Success', 'Note added successfully');
      } else {
        // Don't show alert for permission errors - user will be automatically logged out
        if (response.error?.code !== 'HTTP_403') {
          Alert.alert('Failed', response.error?.message || 'Failed to add note');
        }
      }
    } catch (error) {
      console.error('Add note error:', error);
      Alert.alert('Error', 'Failed to add note');
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateCurrentDuration = () => {
    if (!workSession) return 0;
    
    const startTime = new Date(workSession.startTime);
    const now = new Date();
    const totalMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
    
    // Subtract break time
    const breakTime = workSession.breaks.reduce((total, breakItem) => {
      if (breakItem.endTime) {
        const breakStart = new Date(breakItem.startTime);
        const breakEnd = new Date(breakItem.endTime);
        return total + Math.floor((breakEnd.getTime() - breakStart.getTime()) / (1000 * 60));
      }
      return total;
    }, 0);
    
    return Math.max(0, totalMinutes - breakTime);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!workSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading work session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Work Progress</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Work Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.issueTitle}>{workSession.issueTitle}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: workSession.status === 'active' ? '#4CAF50' : '#FF9800' }
            ]}>
              <Text style={styles.statusText}>
                {workSession.status === 'active' ? 'ACTIVE' : 'PAUSED'}
              </Text>
            </View>
          </View>
          
          <View style={styles.timeInfo}>
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>Started</Text>
              <Text style={styles.timeValue}>{formatTime(workSession.startTime)}</Text>
            </View>
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>Current Time</Text>
              <Text style={styles.timeValue}>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>Duration</Text>
              <Text style={styles.durationValue}>
                {timeEntry ? timeTrackingService.formatDurationWithSeconds(realTimeDuration) : '0:00'}
              </Text>
            </View>
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Location</Text>
          <View style={styles.locationCard}>
            <Ionicons name="location" size={20} color="#FF6B35" />
            <Text style={styles.locationText}>{workSession.location.address}</Text>
            <TouchableOpacity style={styles.navigateButton}>
              <Ionicons name="navigate" size={16} color="#FF6B35" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Photos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Progress Photos ({workSession.photos.length})</Text>
            <TouchableOpacity style={styles.addButton} onPress={selectPhoto}>
              <Ionicons name="images" size={16} color="#FF6B35" />
              <Text style={styles.addButtonText}>Select Photo</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {workSession.photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="image" size={24} color="#ccc" />
                </View>
                <Text style={styles.photoName}>{photo}</Text>
              </View>
            ))}
            {workSession.photos.length === 0 && (
              <View style={styles.emptyPhotos}>
                <Text style={styles.emptyPhotosText}>No photos added yet</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Work Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Work Notes ({workSession.notes.length})</Text>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => setShowAddNote(true)}
            >
              <Ionicons name="create" size={16} color="#FF6B35" />
              <Text style={styles.addButtonText}>Add Note</Text>
            </TouchableOpacity>
          </View>
          
          {workSession.notes.length > 0 ? (
            workSession.notes.map((note, index) => (
              <View key={index} style={styles.noteItem}>
                <Ionicons name="document-text" size={16} color="#666" />
                <Text style={styles.noteText}>{note}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyNotes}>
              <Text style={styles.emptyNotesText}>No notes added yet</Text>
            </View>
          )}
        </View>

        {/* Break History */}
        {workSession.breaks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Break History</Text>
            {workSession.breaks.map((breakItem, index) => (
              <View key={index} style={styles.breakItem}>
                <View style={styles.breakInfo}>
                  <Text style={styles.breakReason}>{breakItem.reason}</Text>
                  <Text style={styles.breakTime}>
                    {formatTime(breakItem.startTime)} - {breakItem.endTime ? formatTime(breakItem.endTime) : 'Ongoing'}
                  </Text>
                </View>
                <Ionicons name="pause-circle" size={20} color="#FF9800" />
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {workSession.status === 'active' ? (
            <>
              <TouchableOpacity style={styles.pauseButton} onPress={pauseWork}>
                <Ionicons name="pause" size={20} color="white" />
                <Text style={styles.pauseButtonText}>Pause Work</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.completeButton} onPress={completeWork}>
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.completeButtonText}>Complete Work</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.resumeButton} onPress={resumeWork}>
              <Ionicons name="play" size={20} color="white" />
              <Text style={styles.resumeButtonText}>Resume Work</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Add Note Modal */}
      {showAddNote && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Work Note</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Enter your work note..."
              value={newNote}
              onChangeText={setNewNote}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowAddNote(false);
                  setNewNote('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={addNote}>
                <Text style={styles.modalSaveText}>Add Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Break Modal */}
      {showBreakModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pause Work</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Reason for break..."
              value={breakReason}
              onChangeText={setBreakReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowBreakModal(false);
                  setBreakReason('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveButton} 
                onPress={() => {
                  pauseWithReason(breakReason || 'Break');
                  setShowBreakModal(false);
                  setBreakReason('');
                }}
              >
                <Text style={styles.modalSaveText}>Pause</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  header: {
    backgroundColor: '#FF6B35',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeItem: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  durationValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  navigateButton: {
    padding: 4,
  },
  photoContainer: {
    marginRight: 12,
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoName: {
    fontSize: 8,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyPhotos: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyPhotosText: {
    fontSize: 14,
    color: '#999',
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  emptyNotes: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyNotesText: {
    fontSize: 14,
    color: '#999',
  },
  breakItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    marginBottom: 8,
  },
  breakInfo: {
    flex: 1,
  },
  breakReason: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  breakTime: {
    fontSize: 12,
    color: '#666',
  },
  actionsSection: {
    padding: 16,
    paddingBottom: 40,
  },
  pauseButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  pauseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  resumeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: width * 0.9,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 16,
    minHeight: 60,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  modalSaveText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default WorkProgressScreen;
