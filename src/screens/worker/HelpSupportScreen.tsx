import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '../../store/store';
import WorkerHeader from '../../components/WorkerHeader';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
}

interface HelpSupportScreenProps {
  navigation: any;
}

const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({ navigation }) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'tickets'>('faq');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    subject: '',
    description: '',
    category: 'technical',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  // Mock FAQs
  const mockFaqs: FAQ[] = [
    {
      id: 'faq-1',
      question: 'How do I update my work status?',
      answer: 'You can update your work status by going to the assignment details and tapping the status button. Select the appropriate status (In Progress, Completed, etc.) and add any necessary comments or photos.',
      category: 'assignments',
    },
    {
      id: 'faq-2',
      question: 'How do I report technical issues with the app?',
      answer: 'To report technical issues, go to Help & Support > Contact Support. Select "Technical Issue" as the category and provide detailed information about the problem you\'re experiencing.',
      category: 'technical',
    },
    {
      id: 'faq-3',
      question: 'Can I change my assigned work area?',
      answer: 'Work area assignments are managed by your department head. Please contact your supervisor or submit a support ticket to request changes to your assigned area.',
      category: 'assignments',
    },
    {
      id: 'faq-4',
      question: 'How is my performance rating calculated?',
      answer: 'Your performance rating is based on several factors including completion rate, response time, quality of work (based on citizen feedback), and adherence to deadlines.',
      category: 'performance',
    },
    {
      id: 'faq-5',
      question: 'What should I do if I can\'t complete an assignment?',
      answer: 'If you encounter issues that prevent completion, update the assignment status to "Blocked" and provide detailed comments about the obstacles. Your supervisor will be notified automatically.',
      category: 'assignments',
    },
  ];

  // Mock support tickets
  const mockTickets: SupportTicket[] = [
    {
      id: 'ticket-1',
      subject: 'App crashes when uploading photos',
      description: 'The app crashes every time I try to upload completion photos',
      category: 'technical',
      priority: 'high',
      status: 'in_progress',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T14:20:00Z',
    },
    {
      id: 'ticket-2',
      subject: 'Request for additional equipment',
      description: 'Need safety equipment for road work assignments',
      category: 'equipment',
      priority: 'medium',
      status: 'resolved',
      createdAt: '2024-01-10T09:15:00Z',
      updatedAt: '2024-01-12T16:45:00Z',
    },
  ];

  useEffect(() => {
    fetchFaqs();
    fetchTickets();
  }, []);

  const fetchFaqs = async () => {
    try {
      const response = await fetch('http://192.168.29.36:3003/api/v1/support/faqs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setFaqs(data.data.faqs);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      // Fallback to mock data
      setFaqs(mockFaqs);
    }
  };

  const fetchTickets = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`http://192.168.29.36:3003/api/v1/support/tickets/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setTickets(data.data.tickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      // Fallback to mock data
      setTickets(mockTickets);
    }
  };

  const handleSubmitTicket = async () => {
    if (!contactForm.subject.trim() || !contactForm.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://192.168.29.36:3003/api/v1/support/tickets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contactForm,
          userId: user?.id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Your support ticket has been submitted. We\'ll get back to you soon!', [
          { text: 'OK', onPress: () => {
            setContactForm({
              subject: '',
              description: '',
              category: 'technical',
              priority: 'medium',
            });
            setActiveTab('tickets');
            fetchTickets(); // Refresh tickets
          }}
        ]);
      } else {
        Alert.alert('Error', data.error?.message || 'Failed to submit support ticket');
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      Alert.alert('Error', 'Failed to submit support ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    Linking.openURL('tel:+911234567890');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@civicreporter.com?subject=Worker Support Request');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#2196F3';
      case 'in_progress': return '#FF9800';
      case 'resolved': return '#4CAF50';
      case 'closed': return '#666';
      default: return '#666';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'faq' && styles.tabButtonActive]}
        onPress={() => setActiveTab('faq')}
      >
        <Ionicons 
          name="help-circle" 
          size={20} 
          color={activeTab === 'faq' ? '#FF6B35' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'faq' && styles.tabTextActive]}>
          FAQ
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'contact' && styles.tabButtonActive]}
        onPress={() => setActiveTab('contact')}
      >
        <Ionicons 
          name="mail" 
          size={20} 
          color={activeTab === 'contact' ? '#FF6B35' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'contact' && styles.tabTextActive]}>
          Contact
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'tickets' && styles.tabButtonActive]}
        onPress={() => setActiveTab('tickets')}
      >
        <Ionicons 
          name="document-text" 
          size={20} 
          color={activeTab === 'tickets' ? '#FF6B35' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'tickets' && styles.tabTextActive]}>
          My Tickets
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFAQTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
      {faqs.map((faq) => (
        <TouchableOpacity
          key={faq.id}
          style={styles.faqItem}
          onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
        >
          <View style={styles.faqHeader}>
            <Text style={styles.faqQuestion}>{faq.question}</Text>
            <Ionicons
              name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
            />
          </View>
          {expandedFaq === faq.id && (
            <Text style={styles.faqAnswer}>{faq.answer}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContactTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Contact Support</Text>
      
      {/* Quick Contact Options */}
      <View style={styles.quickContactSection}>
        <Text style={styles.subsectionTitle}>Quick Contact</Text>
        <View style={styles.quickContactButtons}>
          <TouchableOpacity style={styles.quickContactButton} onPress={handleCall}>
            <Ionicons name="call" size={24} color="#FF6B35" />
            <Text style={styles.quickContactText}>Call Support</Text>
            <Text style={styles.quickContactSubtext}>+91 123 456 7890</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickContactButton} onPress={handleEmail}>
            <Ionicons name="mail" size={24} color="#FF6B35" />
            <Text style={styles.quickContactText}>Email Support</Text>
            <Text style={styles.quickContactSubtext}>support@civicreporter.com</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Support Ticket Form */}
      <View style={styles.formSection}>
        <Text style={styles.subsectionTitle}>Submit Support Ticket</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Subject *</Text>
          <TextInput
            style={styles.textInput}
            value={contactForm.subject}
            onChangeText={(text) => setContactForm(prev => ({ ...prev, subject: text }))}
            placeholder="Brief description of your issue"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Category</Text>
          <View style={styles.categoryButtons}>
            {['technical', 'equipment', 'assignment', 'other'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  contactForm.category === category && styles.categoryButtonActive
                ]}
                onPress={() => setContactForm(prev => ({ ...prev, category }))}
              >
                <Text style={[
                  styles.categoryButtonText,
                  contactForm.category === category && styles.categoryButtonTextActive
                ]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Priority</Text>
          <View style={styles.priorityButtons}>
            {['low', 'medium', 'high'].map((priority) => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.priorityButton,
                  contactForm.priority === priority && styles.priorityButtonActive,
                  { borderColor: getPriorityColor(priority) }
                ]}
                onPress={() => setContactForm(prev => ({ ...prev, priority: priority as any }))}
              >
                <Text style={[
                  styles.priorityButtonText,
                  contactForm.priority === priority && { color: getPriorityColor(priority) }
                ]}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={contactForm.description}
            onChangeText={(text) => setContactForm(prev => ({ ...prev, description: text }))}
            placeholder="Please provide detailed information about your issue"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmitTicket}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTicketsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>My Support Tickets</Text>
      {tickets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Support Tickets</Text>
          <Text style={styles.emptyText}>You haven't submitted any support tickets yet.</Text>
        </View>
      ) : (
        tickets.map((ticket) => (
          <View key={ticket.id} style={styles.ticketItem}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketSubject}>{ticket.subject}</Text>
              <View style={[styles.ticketStatus, { backgroundColor: getStatusColor(ticket.status) }]}>
                <Text style={styles.ticketStatusText}>
                  {ticket.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            
            <Text style={styles.ticketDescription} numberOfLines={2}>
              {ticket.description}
            </Text>
            
            <View style={styles.ticketMeta}>
              <View style={styles.ticketMetaItem}>
                <Text style={styles.ticketMetaLabel}>Category:</Text>
                <Text style={styles.ticketMetaValue}>{ticket.category}</Text>
              </View>
              <View style={styles.ticketMetaItem}>
                <Text style={styles.ticketMetaLabel}>Priority:</Text>
                <Text style={[styles.ticketMetaValue, { color: getPriorityColor(ticket.priority) }]}>
                  {ticket.priority.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <Text style={styles.ticketDate}>
              Created: {new Date(ticket.createdAt).toLocaleDateString()}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <WorkerHeader
        title="Help & Support"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      {renderTabButtons()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'faq' && renderFAQTab()}
        {activeTab === 'contact' && renderContactTab()}
        {activeTab === 'tickets' && renderTicketsTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#fff5f0',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  tabTextActive: {
    color: '#FF6B35',
  },
  tabContent: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  faqItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  quickContactSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  quickContactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickContactButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickContactText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  quickContactSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
  textArea: {
    height: 100,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
  },
  priorityButtonActive: {
    backgroundColor: '#fff',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  ticketItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  ticketStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ticketStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  ticketDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  ticketMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ticketMetaItem: {
    flexDirection: 'row',
    marginRight: 16,
  },
  ticketMetaLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  ticketMetaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  ticketDate: {
    fontSize: 12,
    color: '#999',
  },
});

export default HelpSupportScreen;
