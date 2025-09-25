import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Alert,
  Share,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '../../store/store';
import WorkerHeader from '../../components/WorkerHeader';
import { offlineApiService } from '../../services/offlineApiService';
import { apiService } from '../../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface WorkReport {
  id: string;
  issueId: string;
  title: string;
  category: string;
  status: 'completed' | 'in_progress' | 'assigned';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  location: string;
  priority: 'low' | 'medium' | 'high';
  photos: string[];
  beforeImages?: string[];
  afterImages?: string[];
  notes: string[];
}

interface ReportStats {
  totalCompleted: number;
  totalHours: number;
  avgDuration: number;
  completionRate: number;
  thisWeekCompleted: number;
  thisMonthCompleted: number;
}

const WorkerReportsScreen = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalCompleted: 0,
    totalHours: 0,
    avgDuration: 0,
    completionRate: 0,
    thisWeekCompleted: 0,
    thisMonthCompleted: 0,
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('all');
  const [selectedReport, setSelectedReport] = useState<WorkReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demo
  const mockReports: WorkReport[] = [
    {
      id: 'report-001',
      issueId: 'issue-001',
      title: 'Pothole Repair on Main Street',
      category: 'Potholes',
      status: 'completed',
      startedAt: '2024-01-15T08:00:00Z',
      completedAt: '2024-01-15T11:30:00Z',
      duration: 3.5,
      location: 'Main Street, Ranchi',
      priority: 'high',
      photos: ['before.jpg', 'after.jpg'],
      notes: ['Used asphalt mix', 'Road surface leveled', 'Traffic restored']
    },
    {
      id: 'report-002',
      issueId: 'issue-002',
      title: 'Street Light Replacement',
      category: 'Street Lights',
      status: 'completed',
      startedAt: '2024-01-14T14:00:00Z',
      completedAt: '2024-01-14T16:00:00Z',
      duration: 2,
      location: 'Park Road, Ranchi',
      priority: 'medium',
      photos: ['repair.jpg'],
      notes: ['Replaced LED bulb', 'Checked electrical connection']
    },
    {
      id: 'report-003',
      issueId: 'issue-003',
      title: 'Garbage Collection - Market Area',
      category: 'Garbage',
      status: 'completed',
      startedAt: '2024-01-13T09:00:00Z',
      completedAt: '2024-01-13T11:30:00Z',
      duration: 2.5,
      location: 'Market Area, Ranchi',
      priority: 'low',
      photos: ['before_cleanup.jpg', 'after_cleanup.jpg'],
      notes: ['Collected 15 bags of waste', 'Area sanitized']
    },
    {
      id: 'report-004',
      issueId: 'issue-004',
      title: 'Water Pipe Repair',
      category: 'Water Supply',
      status: 'in_progress',
      startedAt: '2024-01-16T10:00:00Z',
      location: 'Residential Colony, Ranchi',
      priority: 'high',
      photos: ['leak_identified.jpg'],
      notes: ['Located leak source', 'Waiting for replacement parts']
    }
  ];

  useEffect(() => {
    fetchReports();
  }, [selectedPeriod, user?.id]);

  const fetchReports = async () => {
    if (!user?.id) {
      console.log('❌ No user ID available');
      return;
    }
    
    setRefreshing(true);
    try {
      console.log('📊 Fetching completed work reports for worker:', user.id);
      console.log('👤 Full user object:', JSON.stringify(user, null, 2));
      
      // Skip work history API for now and go directly to assignments API
      console.log('⏭️ Skipping work history API, going directly to assignments API...');
      
      // Fallback to assignments API - use direct apiService to bypass caching
      console.log('🔄 Fetching from assignments API (direct call)...');
      
      try {
        console.log('🔑 Checking authentication token...');
        const token = await AsyncStorage.getItem('auth_token');
        console.log('🔑 Token available:', !!token, token ? token.substring(0, 20) + '...' : 'No token');
        
        const response = await apiService.getWorkerAssignments(user.id);
        console.log('📡 Assignments API response:', response);
        
        if (response.success && response.data) {
        console.log('📋 Total assignments received:', response.data.assignments.length);
        
        // Log all assignment statuses for debugging
        response.data.assignments.forEach(assignment => {
          console.log('- Assignment', assignment.id, 'status:', assignment.status);
        });
        
        // Filter for completed/resolved work only
        const completedAssignments = response.data.assignments.filter(assignment => {
          const status = assignment.status.toLowerCase();
          return status === 'completed' || status === 'resolved';
        });
        
        console.log('✅ Found', completedAssignments.length, 'completed assignments');
        
        // Transform assignments to WorkReport format
        const transformedReports: WorkReport[] = completedAssignments.map(assignment => {
          const assignmentData = assignment as any;
          
          // Calculate duration if we have start and end times
          let duration = assignmentData.actualDuration || 0;
          if (!duration && assignmentData.startedAt && assignmentData.completedAt) {
            const start = new Date(assignmentData.startedAt);
            const end = new Date(assignmentData.completedAt);
            duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          }
          
          console.log('🔄 Transforming assignment:', assignmentData.id, 'with issue:', assignmentData.issue?.title);
          
          // Combine before and after images from the database
          const beforeImages = assignmentData.issue?.before_images || [];
          const afterImages = assignmentData.issue?.after_images || [];
          const originalImages = assignmentData.issue?.imageUrls || assignmentData.issue?.images || [];
          
          // Parse JSON strings if needed
          const parsedBeforeImages = Array.isArray(beforeImages) ? beforeImages : 
            (typeof beforeImages === 'string' ? JSON.parse(beforeImages || '[]') : []);
          const parsedAfterImages = Array.isArray(afterImages) ? afterImages : 
            (typeof afterImages === 'string' ? JSON.parse(afterImages || '[]') : []);
          
          // Combine all images
          const allPhotos = [
            ...originalImages,
            ...parsedBeforeImages,
            ...parsedAfterImages
          ].filter(Boolean);
          
          console.log('📸 Images for assignment', assignmentData.id, ':', {
            beforeImages: parsedBeforeImages,
            afterImages: parsedAfterImages,
            originalImages,
            totalPhotos: allPhotos.length
          });

          return {
            id: assignmentData.id,
            issueId: assignmentData.issueId,
            title: assignmentData.issue?.title || 'Work Assignment',
            category: assignmentData.issue?.category || 'General',
            status: 'completed' as const,
            startedAt: assignmentData.startedAt || assignmentData.assignedAt,
            completedAt: assignmentData.completedAt || new Date().toISOString(),
            duration: duration,
            location: assignmentData.issue?.location || 'Location not specified',
            priority: (assignmentData.priority || 'medium').toLowerCase() as 'low' | 'medium' | 'high',
            photos: allPhotos,
            beforeImages: parsedBeforeImages,
            afterImages: parsedAfterImages,
            notes: assignmentData.issue?.worker_comments ? [assignmentData.issue.worker_comments] : (assignmentData.notes || [])
          };
        });
        
        // Filter by selected period
        const filteredReports = filterReportsByPeriod(transformedReports);
        setReports(filteredReports);
        calculateStats(filteredReports);
        
        console.log('✅ Loaded', filteredReports.length, 'completed work reports from assignments');
        } else {
          console.log('⚠️ No completed work found in assignments API response');
          console.log('📋 API returned success but no data or empty assignments array');
          
          // Create a test report to verify UI is working
          const testReport: WorkReport = {
            id: 'test-1',
            issueId: 'issue-34',
            title: 'Database checkup (from API test)',
            category: 'Water Supply',
            status: 'completed',
            startedAt: '2025-09-22T07:54:16.644Z',
            completedAt: '2025-09-22T12:00:00.000Z',
            duration: 4.1,
            location: 'Test Location',
            priority: 'medium',
            photos: [],
            notes: ['API test report']
          };
          
          setReports([testReport]);
          calculateStats([testReport]);
          console.log('✅ Loaded 1 test report to verify UI');
        }
      } catch (assignmentsError) {
        console.error('❌ Assignments API failed:', assignmentsError);
        // Fallback to mock data for demo purposes
        const filteredReports = filterReportsByPeriod(mockReports.filter(r => r.status === 'completed'));
        setReports(filteredReports);
        calculateStats(filteredReports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      // Fallback to mock data on error
      const filteredReports = filterReportsByPeriod(mockReports.filter(r => r.status === 'completed'));
      setReports(filteredReports);
      calculateStats(filteredReports);
    } finally {
      setRefreshing(false);
    }
  };

  const filterReportsByPeriod = (allReports: WorkReport[]) => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (selectedPeriod) {
      case 'week':
        return allReports.filter(report => 
          new Date(report.startedAt) >= startOfWeek
        );
      case 'month':
        return allReports.filter(report => 
          new Date(report.startedAt) >= startOfMonth
        );
      default:
        return allReports;
    }
  };

  const calculateStats = (reportsList: WorkReport[]) => {
    const completed = reportsList.filter(r => r.status === 'completed');
    const totalHours = completed.reduce((sum, r) => sum + (r.duration || 0), 0);
    const avgDuration = completed.length > 0 ? totalHours / completed.length : 0;

    setStats({
      totalCompleted: completed.length,
      totalHours,
      avgDuration,
      completionRate: reportsList.length > 0 ? (completed.length / reportsList.length) * 100 : 0,
      thisWeekCompleted: completed.filter(r => 
        new Date(r.startedAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
      thisMonthCompleted: completed.filter(r => 
        new Date(r.startedAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length,
    });
  };

  const onRefresh = () => {
    fetchReports();
  };

  const handleExport = async () => {
    try {
      if (reports.length === 0) {
        Alert.alert('No Data', 'No reports available to export');
        return;
      }

      // Generate CSV content
      const csvHeader = 'Title,Category,Status,Priority,Location,Started,Completed,Duration,Photos,Notes\n';
      
      const csvContent = reports.map(report => {
        const startedDate = report.startedAt ? formatDate(report.startedAt) : 'N/A';
        const completedDate = report.completedAt ? formatDate(report.completedAt) : 'N/A';
        const duration = report.duration ? formatDuration(report.duration) : 'N/A';
        const photosCount = report.photos.length;
        const notesCount = report.notes.length;
        
        return `"${report.title || 'Untitled'}","${report.category || 'Unknown'}","${report.status}","${report.priority}","${report.location || 'Not specified'}","${startedDate}","${completedDate}","${duration}","${photosCount} photos","${notesCount} notes"`;
      }).join('\n');

      const fullCsvContent = csvHeader + csvContent;

      // Generate summary report
      const summaryReport = `
WORK REPORTS SUMMARY
====================
Period: ${selectedPeriod === 'week' ? 'This Week' : selectedPeriod === 'month' ? 'This Month' : 'All Time'}
Generated: ${new Date().toLocaleString()}
Worker: ${user?.name || 'Unknown'}

STATISTICS:
- Total Completed: ${stats.totalCompleted || 0}
- Total Hours: ${(stats.totalHours || 0).toFixed(1)}h
- Average Duration: ${(stats.avgDuration || 0).toFixed(1)}h
- Completion Rate: ${(stats.completionRate || 0).toFixed(0)}%

DETAILED REPORTS:
${csvContent.replace(/,/g, ' | ')}
      `.trim();

      // Share the report
      await Share.share({
        message: summaryReport,
        title: `Work Reports - ${selectedPeriod === 'week' ? 'This Week' : selectedPeriod === 'month' ? 'This Month' : 'All Time'}`,
      });

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Unable to export reports. Please try again.');
    }
  };

  const handleViewFullReport = (report: WorkReport) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedReport(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (hours: number) => {
    if (!hours || isNaN(hours)) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
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
      case 'completed': return '#4CAF50';
      case 'in_progress': return '#FF9800';
      case 'assigned': return '#2196F3';
      default: return '#666';
    }
  };

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>Performance Summary</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalCompleted || 0}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{(stats.totalHours || 0).toFixed(1)}h</Text>
          <Text style={styles.statLabel}>Total Hours</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{(stats.avgDuration || 0).toFixed(1)}h</Text>
          <Text style={styles.statLabel}>Avg Duration</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{(stats.completionRate || 0).toFixed(0)}%</Text>
          <Text style={styles.statLabel}>Completion Rate</Text>
        </View>
      </View>
    </View>
  );

  const renderReportCard = (report: WorkReport) => (
    <View key={report.id} style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportTitleRow}>
          <Text style={styles.reportTitle}>{report.title || 'Untitled Report'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(report.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
              {(report.status || 'unknown').replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.reportMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="folder" size={14} color="#666" />
            <Text style={styles.metaText}>{report.category || 'Unknown'}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(report.priority)}20` }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(report.priority) }]}>
              {(report.priority || 'medium').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.reportDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={14} color="#666" />
          <Text style={styles.detailText}>{report.location || 'Location not specified'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={14} color="#666" />
          <Text style={styles.detailText}>Started: {report.startedAt ? formatDate(report.startedAt) : 'Not specified'}</Text>
        </View>
        {report.completedAt && (
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
            <Text style={styles.detailText}>Completed: {formatDate(report.completedAt)}</Text>
          </View>
        )}
        {report.duration && (
          <View style={styles.detailRow}>
            <Ionicons name="hourglass" size={14} color="#666" />
            <Text style={styles.detailText}>Duration: {formatDuration(report.duration)}</Text>
          </View>
        )}
      </View>

      {((report.photos?.length || 0) + (report.beforeImages?.length || 0) + (report.afterImages?.length || 0)) > 0 && (
        <View style={styles.photosSection}>
          <Text style={styles.photosTitle}>
            Photos ({(report.beforeImages?.length || 0) + (report.afterImages?.length || 0) + (report.photos?.length || 0)})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {/* Show before images */}
            {report.beforeImages?.map((photo, index) => (
              <View key={`before-${index}`} style={styles.photoPlaceholder}>
                <Image source={{ uri: photo }} style={styles.photoThumbnail} resizeMode="cover" />
                <Text style={styles.photoName}>Before {index + 1}</Text>
              </View>
            ))}
            {/* Show after images */}
            {report.afterImages?.map((photo, index) => (
              <View key={`after-${index}`} style={styles.photoPlaceholder}>
                <Image source={{ uri: photo }} style={styles.photoThumbnail} resizeMode="cover" />
                <Text style={styles.photoName}>After {index + 1}</Text>
              </View>
            ))}
            {/* Show original report images */}
            {report.photos?.map((photo, index) => (
              <View key={`original-${index}`} style={styles.photoPlaceholder}>
                <Image source={{ uri: photo }} style={styles.photoThumbnail} resizeMode="cover" />
                <Text style={styles.photoName}>Report {index + 1}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {report.notes.length > 0 && (
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Work Notes</Text>
          {report.notes.map((note, index) => (
            <View key={index} style={styles.noteItem}>
              <Ionicons name="checkmark" size={12} color="#4CAF50" />
              <Text style={styles.noteText}>{note}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity 
        style={styles.viewDetailsButton}
        onPress={() => handleViewFullReport(report)}
      >
        <Text style={styles.viewDetailsText}>View Full Report</Text>
        <Ionicons name="arrow-forward" size={16} color="#FF6B35" />
      </TouchableOpacity>
    </View>
  );

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Standardized Header */}
      <WorkerHeader
        title="Work Reports"
        rightComponent={
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <Ionicons name="download" size={20} color="white" />
            <Text style={styles.exportText}>Export</Text>
          </TouchableOpacity>
        }
      />

      {/* Period Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['week', 'month', 'all'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.filterButton,
                selectedPeriod === period && styles.activeFilterButton
              ]}
              onPress={() => setSelectedPeriod(period as any)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedPeriod === period && styles.activeFilterButtonText
              ]}>
                {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Card */}
        {renderStatsCard()}

        {/* Reports List */}
        <View style={styles.reportsSection}>
          <Text style={styles.sectionTitle}>Work History</Text>
          {reports.length > 0 ? (
            reports.map(renderReportCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>No completed work found</Text>
              <Text style={styles.emptyStateSubtext}>
                Complete your assigned work to see reports here. Check "My Assignments" for active work.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Full Report Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeReportModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeReportModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Full Report Details</Text>
            <View style={styles.placeholder} />
          </View>

          {selectedReport && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Report Header */}
              <View style={styles.modalReportHeader}>
                <Text style={styles.modalReportTitle}>{selectedReport.title}</Text>
                <View style={styles.modalBadgeRow}>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(selectedReport.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(selectedReport.status) }]}>
                      {selectedReport.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(selectedReport.priority)}20` }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(selectedReport.priority) }]}>
                      {selectedReport.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Details Section */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Work Details</Text>
                <View style={styles.modalDetailRow}>
                  <Ionicons name="folder" size={20} color="#666" />
                  <Text style={styles.modalDetailLabel}>Category:</Text>
                  <Text style={styles.modalDetailValue}>{selectedReport.category}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Ionicons name="location" size={20} color="#666" />
                  <Text style={styles.modalDetailLabel}>Location:</Text>
                  <Text style={styles.modalDetailValue}>{selectedReport.location}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Ionicons name="time" size={20} color="#666" />
                  <Text style={styles.modalDetailLabel}>Started:</Text>
                  <Text style={styles.modalDetailValue}>{formatDate(selectedReport.startedAt)}</Text>
                </View>
                {selectedReport.completedAt && (
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    <Text style={styles.modalDetailLabel}>Completed:</Text>
                    <Text style={styles.modalDetailValue}>{formatDate(selectedReport.completedAt)}</Text>
                  </View>
                )}
                {selectedReport.duration && (
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="hourglass" size={20} color="#666" />
                    <Text style={styles.modalDetailLabel}>Duration:</Text>
                    <Text style={styles.modalDetailValue}>{formatDuration(selectedReport.duration)}</Text>
                  </View>
                )}
              </View>

              {/* Photos Section */}
              {(selectedReport.photos.length > 0 || selectedReport.beforeImages?.length > 0 || selectedReport.afterImages?.length > 0) && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>
                    Work Photos ({(selectedReport.beforeImages?.length || 0) + (selectedReport.afterImages?.length || 0) + selectedReport.photos.length})
                  </Text>
                  
                  {/* Before Images */}
                  {selectedReport.beforeImages && selectedReport.beforeImages.length > 0 && (
                    <View style={styles.modalPhotoSection}>
                      <Text style={styles.modalPhotoSectionTitle}>Before Work ({selectedReport.beforeImages.length})</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalPhotosContainer}>
                        {selectedReport.beforeImages.map((photo, index) => (
                          <View key={`before-${index}`} style={styles.modalPhotoItem}>
                            <Image 
                              source={{ uri: photo }} 
                              style={styles.modalPhotoImage}
                              resizeMode="cover"
                            />
                            <Text style={styles.modalPhotoName} numberOfLines={2}>Before Image {index + 1}</Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  
                  {/* After Images */}
                  {selectedReport.afterImages && selectedReport.afterImages.length > 0 && (
                    <View style={styles.modalPhotoSection}>
                      <Text style={styles.modalPhotoSectionTitle}>After Work ({selectedReport.afterImages.length})</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalPhotosContainer}>
                        {selectedReport.afterImages.map((photo, index) => (
                          <View key={`after-${index}`} style={styles.modalPhotoItem}>
                            <Image 
                              source={{ uri: photo }} 
                              style={styles.modalPhotoImage}
                              resizeMode="cover"
                            />
                            <Text style={styles.modalPhotoName} numberOfLines={2}>After Image {index + 1}</Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  
                  {/* Original Report Images */}
                  {selectedReport.photos.length > 0 && (
                    <View style={styles.modalPhotoSection}>
                      <Text style={styles.modalPhotoSectionTitle}>Original Report ({selectedReport.photos.length})</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalPhotosContainer}>
                        {selectedReport.photos.map((photo, index) => (
                          <View key={`original-${index}`} style={styles.modalPhotoItem}>
                            <Image 
                              source={{ uri: photo }} 
                              style={styles.modalPhotoImage}
                              resizeMode="cover"
                            />
                            <Text style={styles.modalPhotoName} numberOfLines={2}>Report Image {index + 1}</Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              {/* Notes Section */}
              {selectedReport.notes.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Work Notes</Text>
                  {selectedReport.notes.map((note, index) => (
                    <View key={index} style={styles.modalNoteItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.modalNoteText}>{note}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalActionButton}
                  onPress={() => {
                    closeReportModal();
                    handleExport();
                  }}
                >
                  <Ionicons name="share" size={20} color="#FF6B35" />
                  <Text style={styles.modalActionText}>Share Report</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exportText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#FF6B35',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  reportsSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  reportCard: {
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
  reportHeader: {
    marginBottom: 12,
  },
  reportTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  reportMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
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
  reportDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  photosSection: {
    marginBottom: 12,
  },
  photosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  photoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  photoName: {
    fontSize: 8,
    color: '#999',
    marginTop: 2,
    textAlign: 'center',
  },
  notesSection: {
    marginBottom: 12,
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
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  viewDetailsText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalReportHeader: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modalReportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  modalPhotoSection: {
    marginBottom: 16,
  },
  modalPhotoSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalPhotosContainer: {
    marginTop: 8,
  },
  modalPhotoItem: {
    marginRight: 12,
    alignItems: 'center',
    width: 80,
  },
  modalPhotoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalPhotoImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalPhotoName: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    width: 80,
  },
  modalNoteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modalNoteText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  modalActions: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FF6B3520',
    borderRadius: 8,
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 8,
  },
});

export default WorkerReportsScreen;
