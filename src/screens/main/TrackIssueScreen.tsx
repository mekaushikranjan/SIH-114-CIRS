import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { apiService } from '../../services/apiService';

const TrackIssueScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { issueId } = route.params as { issueId: string };
  
  // State for real data
  const [issue, setIssue] = useState<any>(null);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Load issue details on mount
  useEffect(() => {
    loadIssueDetails();
  }, [issueId]);

  const loadIssueDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getIssueDetails(issueId);
      
      if (response.success && response.data) {
        setIssue(response.data.issue);
        setStatusHistory(response.data.statusHistory || []);
        setComments(response.data.comments || []);
      } else {
        setError('Failed to load issue details');
      }
    } catch (err) {
      console.error('Error loading issue details:', err);
      setError('Failed to load issue details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    try {
      setSubmittingRating(true);
      
      const response = await apiService.addIssueRating(issueId, rating, ratingComment);
      
      if (response.success) {
        Alert.alert('Success', 'Thank you for your feedback!');
        setShowRatingModal(false);
        // Refresh issue details to show the rating
        loadIssueDetails();
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to submit rating');
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'REPORTED': return '#FF9800';
      case 'IN_REVIEW': return '#2196F3';
      case 'ASSIGNED': return '#9C27B0';
      case 'IN_PROGRESS': return '#FF5722';
      case 'RESOLVED': return '#4CAF50';
      case 'REJECTED': return '#f44336';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'REPORTED': return 'document-text';
      case 'IN_REVIEW': return 'eye';
      case 'ASSIGNED': return 'person';
      case 'IN_PROGRESS': return 'construct';
      case 'RESOLVED': return 'checkmark-done-circle';
      case 'REJECTED': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const getStatusTitle = (status: string) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'REPORTED': return 'Issue Reported';
      case 'IN_REVIEW': return 'Under Review';
      case 'ASSIGNED': return 'Assigned to Worker';
      case 'IN_PROGRESS': return 'Work in Progress';
      case 'RESOLVED': return 'Issue Resolved';
      case 'REJECTED': return 'Issue Rejected';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return '#D32F2F';
      case 'HIGH': return '#F57C00';
      case 'MEDIUM': return '#1976D2';
      case 'LOW': return '#388E3C';
      default: return '#757575';
    }
  };

  const getDaysRemaining = (deadlineString: string) => {
    const deadline = new Date(deadlineString);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSetReminder = () => {
    Alert.alert(
      'Reminder Set',
      'You will be notified when there are updates on this issue.',
      [{ text: 'OK' }]
    );
  };

  const handleReportProblem = () => {
    Alert.alert(
      'Report Problem',
      'Please describe the issue with the current status or progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', onPress: () => {} },
      ]
    );
  };

  const handleRateIssue = () => {
    if (issue?.status?.toUpperCase() === 'RESOLVED') {
      setShowRatingModal(true);
    } else {
      Alert.alert('Cannot Rate', 'You can only rate resolved issues.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading issue details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !issue) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF5722" />
          <Text style={styles.errorText}>{error || 'Issue not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadIssueDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Issue Info Card */}
        <View style={styles.issueInfoCard}>
          <View style={styles.issueHeader}>
            <Text style={styles.issueTitle}>{issue.title || issue.description}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(issue.status) }]}>
              <Ionicons
                name={getStatusIcon(issue.status) as any}
                size={16}
                color="white"
              />
              <Text style={styles.statusText}>{issue.status?.replace('_', ' ')}</Text>
            </View>
          </View>
          
          <Text style={styles.issueDescription}>{issue.description}</Text>
          
          <View style={styles.issueInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                {typeof issue.location === 'string' 
                  ? JSON.parse(issue.location)?.address || issue.location
                  : issue.location?.address || 'Location not specified'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                Submitted: {formatDateShort(issue.createdAt)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                Department: {issue.departmentName || 'Not assigned'}
              </Text>
            </View>
            {issue.assignedToName && (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color="#666" />
                <Text style={styles.infoText}>Worker: {issue.assignedToName}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={16} color="#666" />
              <Text style={styles.infoText}>Category: {issue.categoryName || 'General'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="flag-outline" size={16} color="#666" />
              <Text style={[styles.infoText, { color: getPriorityColor(issue.priority) }]}>
                Priority: {issue.priority}
              </Text>
            </View>
          </View>
        </View>

        {/* User Uploaded Images */}
        {issue.imageUrls && issue.imageUrls.length > 0 && (
          <View style={styles.imagesSection}>
            <Text style={styles.sectionTitle}>Photos You Uploaded</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {issue.imageUrls.map((imageUrl: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri: imageUrl }}
                  style={styles.issueImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Worker Progress Images (After Images) */}
        {issue.after_images && issue.after_images.length > 0 && (
          <View style={styles.imagesSection}>
            <Text style={styles.sectionTitle}>Work Progress Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {issue.after_images.map((imageUrl: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri: imageUrl }}
                  style={styles.issueImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Worker Comments */}
        {issue.worker_comments && (
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>Worker Updates</Text>
            <View style={styles.commentCard}>
              <Text style={styles.commentText}>{issue.worker_comments}</Text>
            </View>
          </View>
        )}

        {/* Rating Display */}
        {issue.rating && (
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Your Rating</Text>
            <View style={styles.ratingDisplay}>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= issue.rating ? 'star' : 'star-outline'}
                    size={24}
                    color="#FFD700"
                  />
                ))}
              </View>
              {issue.ratingComment && (
                <Text style={styles.ratingCommentText}>{issue.ratingComment}</Text>
              )}
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Progress Timeline</Text>
          
          {statusHistory.length > 0 ? (
            statusHistory.map((item, index) => (
              <View key={item.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineIcon,
                    { backgroundColor: getStatusColor(item.newStatus) }
                  ]}>
                    <Ionicons
                      name={getStatusIcon(item.newStatus) as any}
                      size={20}
                      color="white"
                    />
                  </View>
                  {index < statusHistory.length - 1 && (
                    <View style={[
                      styles.timelineLine,
                      { backgroundColor: getStatusColor(item.newStatus) }
                    ]} />
                  )}
                </View>
                
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineTitle}>
                      {getStatusTitle(item.newStatus)}
                    </Text>
                    <Text style={styles.timelineDate}>
                      {formatDate(item.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.timelineDescription}>
                    {item.comment || `Status changed to ${item.newStatus.replace('_', ' ')}`}
                  </Text>
                  {item.changedByName && (
                    <Text style={styles.timelineUser}>
                      Updated by: {item.changedByName}
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyTimeline}>
              <Ionicons name="time-outline" size={32} color="#ccc" />
              <Text style={styles.emptyTimelineText}>No status updates yet</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSetReminder}>
            <Ionicons name="notifications-outline" size={20} color="#2E7D32" />
            <Text style={styles.actionButtonText}>Set Reminder</Text>
          </TouchableOpacity>
          
          {issue.status?.toUpperCase() === 'RESOLVED' && !issue.rating && (
            <TouchableOpacity style={[styles.actionButton, styles.rateButton]} onPress={handleRateIssue}>
              <Ionicons name="star-outline" size={20} color="#FFD700" />
              <Text style={[styles.actionButtonText, { color: '#FFD700' }]}>
                Rate Issue
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.actionButton} onPress={handleReportProblem}>
            <Ionicons name="flag-outline" size={20} color="#f44336" />
            <Text style={[styles.actionButtonText, { color: '#f44336' }]}>
              Report Problem
            </Text>
          </TouchableOpacity>
        </View>

        {/* Additional Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
              <Text style={styles.infoCardTitle}>Issue ID</Text>
            </View>
            <Text style={styles.infoCardText}>{issue.id}</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="pricetag-outline" size={20} color="#2196F3" />
              <Text style={styles.infoCardTitle}>Category</Text>
            </View>
            <Text style={styles.infoCardText}>{issue.category}</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="calendar-outline" size={20} color="#2196F3" />
              <Text style={styles.infoCardTitle}>Estimated Completion</Text>
            </View>
            <Text style={styles.infoCardText}>
              {formatDateShort(issue.estimatedCompletion)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate This Issue Resolution</Text>
            <Text style={styles.modalSubtitle}>How satisfied are you with the resolution?</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color="#FFD700"
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment (optional)"
              value={ratingComment}
              onChangeText={setRatingComment}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRatingModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={submitRating}
                disabled={submittingRating}
              >
                {submittingRating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Rating</Text>
                )}
              </TouchableOpacity>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  issueInfoCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  issueTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  issueDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 15,
  },
  issueInfo: {
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  imagesSection: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  issueImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
  },
  commentsSection: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  commentCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  ratingSection: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  ratingDisplay: {
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  ratingCommentText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  deadlineNormal: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  deadlineUrgent: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  deadlineContent: {
    marginLeft: 15,
    flex: 1,
  },
  deadlineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deadlineText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  timelineSection: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 15,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 10,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  timelineDate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 10,
  },
  timelineDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 8,
  },
  infoSection: {
    margin: 15,
    marginTop: 0,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  infoCardText: {
    fontSize: 14,
    color: '#666',
  },
  timelineUser: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    fontStyle: 'italic',
  },
  emptyTimeline: {
    alignItems: 'center',
    padding: 20,
  },
  emptyTimelineText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  rateButton: {
    borderColor: '#FFD700',
    borderWidth: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 25,
    borderRadius: 15,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  starButton: {
    padding: 5,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    marginBottom: 20,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TrackIssueScreen;
