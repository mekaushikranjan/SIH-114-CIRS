import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { Video } from 'expo-av'; // Will add video support later
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokenStorage } from '../utils/tokenStorage';
import { getCurrentConfig } from '../config/environment';
import { startWorkService } from '../services/startWorkService';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface IssueMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  filename: string;
}

interface IssueLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'REPORTED' | 'IN_REVIEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  location: IssueLocation;
  media: IssueMedia[];
  reportedBy: {
    name: string;
    email: string;
    phone: string;
  };
  reportedAt: string;
  assignedAt?: string;
  estimatedResolution?: string;
}

interface IssueDetailsModalProps {
  visible: boolean;
  issue: Issue | null;
  onClose: () => void;
  onStartWork?: (issueId: string) => void;
  onMarkPriority?: (issueId: string, priority: string) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const IssueDetailsModal: React.FC<IssueDetailsModalProps> = ({
  visible,
  issue,
  onClose,
  onStartWork,
  onMarkPriority,
}) => {
  const insets = useSafeAreaInsets();
  const [fullScreenMedia, setFullScreenMedia] = useState<IssueMedia | null>(null);
  const [showEndWorkModal, setShowEndWorkModal] = useState(false);
  const [workSessionId, setWorkSessionId] = useState<string | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [videoStatus, setVideoStatus] = useState<any>({});
  const { user } = useSelector((state: RootState) => state.auth);

  if (!issue) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return '#FF4444';
      case 'HIGH': return '#FF8800';
      case 'MEDIUM': return '#FFB800';
      case 'LOW': return '#4CAF50';
      default: return '#666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REPORTED': return '#2196F3';
      case 'IN_REVIEW': return '#FF9800';
      case 'ASSIGNED': return '#9C27B0';
      case 'IN_PROGRESS': return '#FF5722';
      case 'RESOLVED': return '#4CAF50';
      case 'REJECTED': return '#F44336';
      default: return '#666';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openLocation = () => {
    const { latitude, longitude } = issue.location;
    console.log('🗺️ Opening location with coordinates:', { latitude, longitude });
    console.log('🗺️ Full issue.location object:', issue.location);
    
    if (latitude === 0 && longitude === 0) {
      Alert.alert('Location Error', 'Location coordinates are not available for this issue.');
      return;
    }
    
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps application');
    });
  };

  const handleStartWork = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    // Use the unified start work service
    await startWorkService.startWork({
      issueId: issue.id,
      assignmentId: undefined, // No assignment ID from modal
      issueTitle: issue.title,
      userId: user.id,
      showConfirmation: true, // Show confirmation for modal (user initiated)
      onSuccess: (sessionId) => {
        console.log('✅ Work started successfully from modal, session ID:', sessionId);
        if (sessionId) {
          setWorkSessionId(sessionId);
        }
        onStartWork?.(issue.id);
      },
      onError: (error) => {
        console.error('❌ Failed to start work from modal:', error);
      }
    });
  };

  const renderMediaItem = (media: IssueMedia, index: number) => {
    if (media.type === 'image') {
      return (
        <TouchableOpacity
          key={media.id}
          style={styles.mediaItem}
          onPress={() => setSelectedMediaIndex(index)}
        >
          <Image
            source={{ uri: media.url }}
            style={styles.mediaThumbnail}
            resizeMode="cover"
          />
          <View style={styles.mediaOverlay}>
            <Ionicons name="expand-outline" size={20} color="white" />
          </View>
        </TouchableOpacity>
      );
    } else if (media.type === 'video') {
      return (
        <TouchableOpacity
          key={media.id}
          style={styles.mediaItem}
          onPress={() => setSelectedMediaIndex(index)}
        >
          <Image
            source={{ uri: media.thumbnail || media.url }}
            style={styles.mediaThumbnail}
            resizeMode="cover"
          />
          <View style={styles.mediaOverlay}>
            <Ionicons name="play-circle" size={24} color="white" />
          </View>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderFullScreenMedia = () => {
    if (selectedMediaIndex === null || !issue.media[selectedMediaIndex]) return null;

    const media = issue.media[selectedMediaIndex];

    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedMediaIndex(null)}
      >
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity
            style={styles.closeFullScreenButton}
            onPress={() => setSelectedMediaIndex(null)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>

          {media.type === 'image' ? (
            <Image
              source={{ uri: media.url }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.fullScreenVideo}>
              <Text style={styles.videoPlaceholder}>
                Video playback will be implemented soon
              </Text>
              <TouchableOpacity
                style={styles.videoLinkButton}
                onPress={() => Linking.openURL(media.url)}
              >
                <Ionicons name="open-outline" size={24} color="white" />
                <Text style={styles.videoLinkText}>Open Video</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.mediaInfo}>
            <Text style={styles.mediaInfoText}>
              {selectedMediaIndex + 1} of {issue.media.length}
            </Text>
            <Text style={styles.mediaInfoText}>{media.filename}</Text>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Issue Details</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Issue Title and Priority */}
            <View style={styles.titleSection}>
              <Text style={styles.issueTitle}>{issue.title}</Text>
              <View style={styles.badgeContainer}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(issue.priority) }]}>
                  <Text style={styles.badgeText}>{issue.priority}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(issue.status) }]}>
                  <Text style={styles.badgeText}>{issue.status.replace('_', ' ')}</Text>
                </View>
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{issue.description}</Text>
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.categoryContainer}>
                <Ionicons name="folder-outline" size={20} color="#FF6B35" />
                <Text style={styles.categoryText}>{issue.category}</Text>
              </View>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <TouchableOpacity style={styles.locationContainer} onPress={openLocation}>
                <View style={styles.locationInfo}>
                  <Ionicons name="location-outline" size={20} color="#FF6B35" />
                  <Text style={styles.locationText}>{issue.location.address}</Text>
                </View>
                <Ionicons name="open-outline" size={20} color="#FF6B35" />
              </TouchableOpacity>
            </View>

            {/* Media */}
            {issue.media && issue.media.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Attachments ({issue.media.length})
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.mediaContainer}
                >
                  {issue.media.map((media, index) => renderMediaItem(media, index))}
                </ScrollView>
              </View>
            )}

            {/* Reporter Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reported By</Text>
              <View style={styles.reporterContainer}>
                <View style={styles.reporterInfo}>
                  <Ionicons name="person-outline" size={20} color="#666" />
                  <View style={styles.reporterDetails}>
                    <Text style={styles.reporterName}>{issue.reportedBy.name}</Text>
                    <Text style={styles.reporterContact}>{issue.reportedBy.email}</Text>
                    <Text style={styles.reporterContact}>{issue.reportedBy.phone}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Timeline */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Timeline</Text>
              <View style={styles.timelineContainer}>
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Issue Reported</Text>
                    <Text style={styles.timelineDate}>{formatDate(issue.reportedAt)}</Text>
                  </View>
                </View>
                {issue.assignedAt && (
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>Assigned to You</Text>
                      <Text style={styles.timelineDate}>{formatDate(issue.assignedAt)}</Text>
                    </View>
                  </View>
                )}
                {issue.estimatedResolution && (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#FFB800' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>Estimated Resolution</Text>
                      <Text style={styles.timelineDate}>{formatDate(issue.estimatedResolution)}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.actionContainer, { paddingBottom: insets.bottom + 20 }]}>
            {issue.status === 'ASSIGNED' && (
              <TouchableOpacity style={styles.primaryButton} onPress={handleStartWork}>
                <Ionicons name="play-circle-outline" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Start Work</Text>
              </TouchableOpacity>
            )}
            
            {issue.status === 'IN_PROGRESS' && (
              <TouchableOpacity style={styles.primaryButton} onPress={() => setShowEndWorkModal(true)}>
                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                <Text style={styles.primaryButtonText}>End Work</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.secondaryButton} onPress={openLocation}>
              <Ionicons name="navigate-outline" size={20} color="#FF6B35" />
              <Text style={styles.secondaryButtonText}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Full Screen Media Modal */}
      {renderFullScreenMedia()}
      
      {/* End Work Modal - TODO: Implement EndWorkModal component */}
      {showEndWorkModal && (
        <Modal visible={showEndWorkModal} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>End Work</Text>
              <Text style={{ marginBottom: 20 }}>End work functionality will be implemented here.</Text>
              <TouchableOpacity 
                style={{ backgroundColor: '#2196F3', padding: 10, borderRadius: 5 }}
                onPress={() => setShowEndWorkModal(false)}
              >
                <Text style={{ color: 'white', textAlign: 'center' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  headerSpacer: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleSection: {
    marginBottom: 20,
  },
  issueTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    lineHeight: 30,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  mediaContainer: {
    marginTop: 10,
  },
  mediaItem: {
    marginRight: 10,
    position: 'relative',
  },
  mediaThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  mediaOverlay: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    padding: 5,
  },
  reporterContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reporterInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  reporterDetails: {
    flex: 1,
  },
  reporterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  reporterContact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  timelineContainer: {
    paddingLeft: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B35',
    marginTop: 5,
    marginRight: 15,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: '#666',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF6B35',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  // Full Screen Media Styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeFullScreenButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight,
  },
  fullScreenVideo: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
  mediaInfo: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
  },
  mediaInfoText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  videoPlaceholder: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  videoLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  videoLinkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default IssueDetailsModal;
