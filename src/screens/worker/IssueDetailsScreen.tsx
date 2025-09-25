import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  Dimensions,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { Video } from 'expo-av'; // Will be added when expo-av is installed
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

const { width } = Dimensions.get('window');

interface IssueDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  address: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved';
  reportedBy: string;
  reportedAt: string;
  imageUrls: string[];
  videoUrl?: string;
  audioUrl?: string;
  assignedWorker?: string;
  assignedAt?: string;
  estimatedDuration?: number;
  materialsRequired?: string[];
}

interface WorkAssignment {
  id: string;
  status: 'assigned' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  notes: string[];
  workPhotos: string[];
}

const IssueDetailsScreen = ({ route, navigation }: any) => {
  const { issueId } = route.params;
  const { user, token } = useSelector((state: RootState) => state.auth);
  
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [assignment, setAssignment] = useState<WorkAssignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{type: 'image' | 'video', url: string} | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);

  // Mock data for demo
  const mockIssue: IssueDetail = {
    id: 'issue-001',
    title: 'Large Pothole on Main Street',
    description: 'There is a large pothole on Main Street near the market area that is causing traffic issues and potential vehicle damage. The pothole is approximately 2 feet wide and 6 inches deep.',
    category: 'Potholes',
    location: 'Main Street, Ranchi',
    address: 'Main Street, Near Central Market, Ranchi, Jharkhand 834001',
    priority: 'high',
    status: 'assigned',
    reportedBy: 'Rajesh Kumar',
    reportedAt: '2024-01-15T09:00:00Z',
    imageUrls: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    assignedWorker: 'WRK001',
    assignedAt: '2024-01-15T10:00:00Z',
    estimatedDuration: 4,
    materialsRequired: ['Asphalt mix', 'Road roller', 'Safety cones']
  };

  const mockAssignment: WorkAssignment = {
    id: 'assign-001',
    status: 'assigned',
    notes: [],
    workPhotos: []
  };

  useEffect(() => {
    fetchIssueDetails();
  }, [issueId]);

  const fetchIssueDetails = async () => {
    setLoading(true);
    try {
      // For demo, using mock data
      // In real app: fetch from API
      setIssue(mockIssue);
      setAssignment(mockAssignment);
    } catch (error) {
      console.error('Error fetching issue details:', error);
      Alert.alert('Error', 'Failed to load issue details');
    } finally {
      setLoading(false);
    }
  };

  const startWork = async () => {
    try {
      Alert.alert(
        'Start Work',
        'Are you ready to start working on this issue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Start Work', 
            onPress: async () => {
              // API call to start work
              setAssignment(prev => prev ? { ...prev, status: 'in_progress', startedAt: new Date().toISOString() } : null);
              Alert.alert('Success', 'Work started successfully');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to start work');
    }
  };

  const completeWork = async () => {
    Alert.alert(
      'Complete Work',
      'Are you sure you want to mark this work as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete', 
          onPress: async () => {
            // API call to complete work
            setAssignment(prev => prev ? { ...prev, status: 'completed', completedAt: new Date().toISOString() } : null);
            setIssue(prev => prev ? { ...prev, status: 'resolved' } : null);
            Alert.alert('Success', 'Work completed successfully');
          }
        }
      ]
    );
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      const updatedNotes = [...(assignment?.notes || []), newNote];
      setAssignment(prev => prev ? { ...prev, notes: updatedNotes } : null);
      setNewNote('');
      setShowAddNote(false);
      Alert.alert('Success', 'Note added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add note');
    }
  };

  const takePhoto = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => {
          // In real app: open camera
          const newPhoto = `work_photo_${Date.now()}.jpg`;
          setAssignment(prev => prev ? { 
            ...prev, 
            workPhotos: [...prev.workPhotos, newPhoto] 
          } : null);
          Alert.alert('Success', 'Photo added successfully');
        }},
        { text: 'Gallery', onPress: () => {
          // In real app: open gallery
          Alert.alert('Info', 'Gallery access would be implemented here');
        }}
      ]
    );
  };

  const navigateToLocation = () => {
    Alert.alert(
      'Navigate',
      'Open navigation to issue location?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Maps', onPress: () => {
          // In real app: open maps with coordinates
          console.log('Navigate to issue location');
        }}
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#9E9E9E';
      case 'assigned': return '#2196F3';
      case 'in_progress': return '#FF9800';
      case 'resolved': return '#4CAF50';
      default: return '#666';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const openMediaModal = (type: 'image' | 'video', url: string) => {
    setSelectedMedia({ type, url });
    setShowMediaModal(true);
  };

  const closeMediaModal = () => {
    setShowMediaModal(false);
    setSelectedMedia(null);
  };

  const hasMedia = () => {
    return (issue?.imageUrls && issue.imageUrls.length > 0) || issue?.videoUrl || issue?.audioUrl;
  };

  if (!issue) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
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
        <Text style={styles.headerTitle}>Issue Details</Text>
        <TouchableOpacity>
          <Ionicons name="share" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Issue Header */}
        <View style={styles.issueHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.issueTitle}>{issue.title}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(issue.priority)}20` }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(issue.priority) }]}>
                {issue.priority.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(issue.status)}20` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(issue.status) }]}>
                {issue.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.categoryText}>{issue.category}</Text>
          </View>
        </View>

        {/* Issue Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Issue Information</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="document-text" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{issue.description}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{issue.address}</Text>
              <TouchableOpacity style={styles.navigateButton} onPress={navigateToLocation}>
                <Ionicons name="navigate" size={16} color="#FF6B35" />
                <Text style={styles.navigateText}>Navigate</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="person" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Reported By</Text>
              <Text style={styles.detailValue}>{issue.reportedBy}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Reported At</Text>
              <Text style={styles.detailValue}>{formatDate(issue.reportedAt)}</Text>
            </View>
          </View>
          
          {issue.estimatedDuration && (
            <View style={styles.detailRow}>
              <Ionicons name="hourglass" size={20} color="#666" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Estimated Duration</Text>
                <Text style={styles.detailValue}>{issue.estimatedDuration} hours</Text>
              </View>
            </View>
          )}
        </View>

        {/* Media Gallery - Photos and Videos */}
        {hasMedia() && (
          <View style={styles.section}>
            <View style={styles.mediaSectionHeader}>
              <Ionicons name="images" size={20} color="#FF6B35" />
              <Text style={styles.sectionTitle}>Media Gallery</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScrollView}>
              {/* Photos */}
              {issue.imageUrls && issue.imageUrls.map((imageUrl, index) => (
                <TouchableOpacity 
                  key={`image-${index}`} 
                  style={styles.mediaContainer}
                  onPress={() => openMediaModal('image', imageUrl)}
                >
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                  <View style={styles.mediaOverlay}>
                    <Ionicons name="expand" size={16} color="white" />
                  </View>
                  <View style={styles.mediaTypeIndicator}>
                    <Ionicons name="image" size={12} color="white" />
                    <Text style={styles.mediaTypeText}>Photo {index + 1}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              {/* Video */}
              {issue.videoUrl && (
                <TouchableOpacity 
                  style={styles.mediaContainer}
                  onPress={() => openMediaModal('video', issue.videoUrl!)}
                >
                  <View style={styles.mediaVideo}>
                    <Ionicons name="videocam" size={40} color="#FF6B35" />
                    <Text style={styles.videoPlaceholderText}>Video Preview</Text>
                  </View>
                  <View style={styles.videoPlayOverlay}>
                    <Ionicons name="play-circle" size={32} color="white" />
                  </View>
                  <View style={styles.mediaTypeIndicator}>
                    <Ionicons name="videocam" size={12} color="white" />
                    <Text style={styles.mediaTypeText}>Video</Text>
                  </View>
                </TouchableOpacity>
              )}
              
              {/* Audio */}
              {issue.audioUrl && (
                <TouchableOpacity style={styles.mediaContainer}>
                  <View style={styles.audioContainer}>
                    <Ionicons name="musical-notes" size={32} color="#FF6B35" />
                    <Text style={styles.audioText}>Audio Recording</Text>
                  </View>
                  <View style={styles.mediaTypeIndicator}>
                    <Ionicons name="mic" size={12} color="white" />
                    <Text style={styles.mediaTypeText}>Audio</Text>
                  </View>
                </TouchableOpacity>
              )}
            </ScrollView>
            
            <View style={styles.mediaInfo}>
              <Ionicons name="information-circle" size={14} color="#666" />
              <Text style={styles.mediaInfoText}>
                Tap any media to view in full screen
              </Text>
            </View>
          </View>
        )}

        {/* Materials Required */}
        {issue.materialsRequired && issue.materialsRequired.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Materials Required</Text>
            {issue.materialsRequired.map((material, index) => (
              <View key={index} style={styles.materialItem}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#666" />
                <Text style={styles.materialText}>{material}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Work Progress */}
        {assignment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Progress</Text>
            
            {assignment.startedAt && (
              <View style={styles.progressItem}>
                <Ionicons name="play-circle" size={20} color="#4CAF50" />
                <Text style={styles.progressText}>
                  Work started at {formatDate(assignment.startedAt)}
                </Text>
              </View>
            )}
            
            {assignment.completedAt && (
              <View style={styles.progressItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.progressText}>
                  Work completed at {formatDate(assignment.completedAt)}
                </Text>
              </View>
            )}
            
            {assignment.workPhotos.length > 0 && (
              <View style={styles.workPhotosSection}>
                <Text style={styles.workPhotosTitle}>Work Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {assignment.workPhotos.map((photo, index) => (
                    <View key={index} style={styles.workPhotoContainer}>
                      <View style={styles.workPhotoPlaceholder}>
                        <Ionicons name="camera" size={24} color="#FF6B35" />
                      </View>
                      <Text style={styles.workPhotoName}>{photo}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {assignment.notes.length > 0 && (
              <View style={styles.notesSection}>
                <Text style={styles.notesTitle}>Work Notes</Text>
                {assignment.notes.map((note, index) => (
                  <View key={index} style={styles.noteItem}>
                    <Ionicons name="document-text" size={16} color="#666" />
                    <Text style={styles.noteText}>{note}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {assignment?.status === 'assigned' && (
            <TouchableOpacity style={styles.primaryButton} onPress={startWork}>
              <Ionicons name="play" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Start Work</Text>
            </TouchableOpacity>
          )}
          
          {assignment?.status === 'in_progress' && (
            <>
              <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto}>
                <Ionicons name="camera" size={20} color="#FF6B35" />
                <Text style={styles.secondaryButtonText}>Add Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={() => setShowAddNote(true)}
              >
                <Ionicons name="create" size={20} color="#FF6B35" />
                <Text style={styles.secondaryButtonText}>Add Note</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.primaryButton} onPress={completeWork}>
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Complete Work</Text>
              </TouchableOpacity>
            </>
          )}
          
          {assignment?.status === 'completed' && (
            <View style={styles.completedMessage}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.completedText}>Work Completed Successfully</Text>
            </View>
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
              numberOfLines={4}
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

      {/* Full Screen Media Modal */}
      <Modal
        visible={showMediaModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMediaModal}
      >
        <View style={styles.fullScreenModalOverlay}>
          <TouchableOpacity 
            style={styles.fullScreenModalClose}
            onPress={closeMediaModal}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          
          {selectedMedia && (
            <View style={styles.fullScreenMediaContainer}>
              {selectedMedia.type === 'image' ? (
                <Image 
                  source={{ uri: selectedMedia.url }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.fullScreenVideoContainer}>
                  <Ionicons name="videocam" size={80} color="white" />
                  <Text style={styles.fullScreenVideoText}>Video Player</Text>
                  <Text style={styles.fullScreenVideoSubtext}>
                    Video playback will be available when expo-av is installed
                  </Text>
                </View>
              )}
            </View>
          )}
          
          <View style={styles.fullScreenMediaInfo}>
            <Text style={styles.fullScreenMediaTitle}>
              {selectedMedia?.type === 'image' ? 'Issue Photo' : 'Issue Video'}
            </Text>
            <Text style={styles.fullScreenMediaSubtitle}>
              Tap outside or press X to close
            </Text>
          </View>
        </View>
      </Modal>
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
  issueHeader: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  issueTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  navigateText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  photoContainer: {
    marginRight: 12,
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoName: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  materialText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  workPhotosSection: {
    marginTop: 16,
  },
  workPhotosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  workPhotoContainer: {
    marginRight: 12,
    alignItems: 'center',
  },
  workPhotoPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  workPhotoName: {
    fontSize: 8,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  notesSection: {
    marginTop: 16,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  actionsSection: {
    padding: 20,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  completedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  completedText: {
    color: '#4CAF50',
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
    minHeight: 80,
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
  // Media Gallery Styles
  mediaSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  mediaScrollView: {
    marginBottom: 12,
  },
  mediaContainer: {
    width: 120,
    height: 120,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholderText: {
    fontSize: 12,
    color: '#FF6B35',
    marginTop: 4,
    fontWeight: '600',
  },
  mediaOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 4,
  },
  mediaTypeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  mediaTypeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  audioContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
  },
  audioText: {
    fontSize: 12,
    color: '#FF6B35',
    marginTop: 4,
    fontWeight: '600',
  },
  mediaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  mediaInfoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  // Full Screen Modal Styles
  fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  fullScreenMediaContainer: {
    width: width * 0.9,
    height: width * 0.9,
    maxHeight: '70%',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenVideoContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  fullScreenVideoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  fullScreenVideoSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  fullScreenMediaInfo: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  fullScreenMediaTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fullScreenMediaSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
});

export default IssueDetailsScreen;
