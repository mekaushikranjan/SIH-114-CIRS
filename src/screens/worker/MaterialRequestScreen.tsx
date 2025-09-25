import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { apiService } from '../../services/apiService';

interface MaterialItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  description?: string;
  estimatedCost?: number;
}

interface MaterialRequest {
  id: string;
  workerId: string;
  assignmentId?: string;
  items: {
    materialId: string;
    material: MaterialItem;
    quantity: number;
    urgency: 'low' | 'medium' | 'high' | 'urgent';
    notes?: string;
  }[];
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  totalEstimatedCost: number;
  requestedAt: string;
  approvedAt?: string;
  fulfilledAt?: string;
  notes?: string;
  approverNotes?: string;
}

const MATERIAL_CATEGORIES = [
  'Tools & Equipment',
  'Construction Materials',
  'Electrical Supplies',
  'Plumbing Supplies',
  'Safety Equipment',
  'Cleaning Supplies',
  'Vehicle Parts',
  'Other'
];

const COMMON_MATERIALS: MaterialItem[] = [
  { id: '1', name: 'Cement Bag (50kg)', category: 'Construction Materials', unit: 'bag', estimatedCost: 350 },
  { id: '2', name: 'Steel Rod (12mm)', category: 'Construction Materials', unit: 'piece', estimatedCost: 450 },
  { id: '3', name: 'Safety Helmet', category: 'Safety Equipment', unit: 'piece', estimatedCost: 150 },
  { id: '4', name: 'Safety Vest', category: 'Safety Equipment', unit: 'piece', estimatedCost: 200 },
  { id: '5', name: 'Shovel', category: 'Tools & Equipment', unit: 'piece', estimatedCost: 300 },
  { id: '6', name: 'Hammer', category: 'Tools & Equipment', unit: 'piece', estimatedCost: 250 },
  { id: '7', name: 'Wire (10mm)', category: 'Electrical Supplies', unit: 'meter', estimatedCost: 15 },
  { id: '8', name: 'PVC Pipe (4 inch)', category: 'Plumbing Supplies', unit: 'meter', estimatedCost: 120 },
  { id: '9', name: 'Paint (White)', category: 'Construction Materials', unit: 'liter', estimatedCost: 180 },
  { id: '10', name: 'Gloves', category: 'Safety Equipment', unit: 'pair', estimatedCost: 80 },
];

const MaterialRequestScreen = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New request state
  const [newRequest, setNewRequest] = useState<{
    assignmentId?: string;
    items: {
      materialId: string;
      material: MaterialItem;
      quantity: number;
      urgency: 'low' | 'medium' | 'high' | 'urgent';
      notes?: string;
    }[];
    notes?: string;
  }>({
    items: []
  });

  useEffect(() => {
    loadMaterialRequests();
  }, []);

  const loadMaterialRequests = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMaterialRequests(user?.id || '');
      
      if (response.success) {
        setRequests(response.data.requests || []);
      }
    } catch (error) {
      console.error('Error loading material requests:', error);
      Alert.alert('Error', 'Failed to load material requests');
    } finally {
      setLoading(false);
    }
  };

  const addMaterialToRequest = (material: MaterialItem) => {
    const existingItem = newRequest.items.find(item => item.materialId === material.id);
    
    if (existingItem) {
      // Increase quantity if already exists
      setNewRequest(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.materialId === material.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }));
    } else {
      // Add new item
      setNewRequest(prev => ({
        ...prev,
        items: [...prev.items, {
          materialId: material.id,
          material,
          quantity: 1,
          urgency: 'medium'
        }]
      }));
    }
    
    setShowMaterialSelector(false);
  };

  const updateItemQuantity = (materialId: string, quantity: number) => {
    if (quantity <= 0) {
      // Remove item if quantity is 0
      setNewRequest(prev => ({
        ...prev,
        items: prev.items.filter(item => item.materialId !== materialId)
      }));
    } else {
      setNewRequest(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.materialId === materialId
            ? { ...item, quantity }
            : item
        )
      }));
    }
  };

  const updateItemUrgency = (materialId: string, urgency: 'low' | 'medium' | 'high' | 'urgent') => {
    setNewRequest(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.materialId === materialId
          ? { ...item, urgency }
          : item
      )
    }));
  };

  const submitMaterialRequest = async () => {
    if (newRequest.items.length === 0) {
      Alert.alert('Error', 'Please add at least one material item');
      return;
    }

    try {
      setLoading(true);
      
      const totalEstimatedCost = newRequest.items.reduce((total, item) => {
        return total + (item.material.estimatedCost || 0) * item.quantity;
      }, 0);

      const requestData = {
        workerId: user?.workerId,
        assignmentId: newRequest.assignmentId,
        items: newRequest.items,
        totalEstimatedCost,
        notes: newRequest.notes
      };

      const response = await apiService.submitMaterialRequest(requestData);
      
      if (response.success) {
        Alert.alert('Success', 'Material request submitted successfully');
        setShowNewRequestModal(false);
        setNewRequest({ items: [] });
        loadMaterialRequests();
      } else {
        // Don't show alert for permission errors - user will be automatically logged out
        if (response.error?.code !== 'HTTP_403') {
          Alert.alert('Error', response.error?.message || 'Failed to submit request');
        }
      }
    } catch (error) {
      console.error('Error submitting material request:', error);
      Alert.alert('Error', 'Failed to submit material request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'fulfilled': return '#2196F3';
      default: return '#666';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#2196F3';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const filteredMaterials = COMMON_MATERIALS.filter(material => {
    const matchesCategory = !selectedCategory || material.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const renderRequestItem = ({ item }: { item: MaterialRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <Text style={styles.requestId}>Request #{item.id.slice(-6)}</Text>
          <Text style={styles.requestDate}>
            {new Date(item.requestedAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.requestItems}>
        {item.items.map((requestItem, index) => (
          <View key={index} style={styles.requestItemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{requestItem.material.name}</Text>
              <Text style={styles.itemDetails}>
                Qty: {requestItem.quantity} {requestItem.material.unit}
              </Text>
            </View>
            <View style={styles.itemMeta}>
              <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(requestItem.urgency) }]}>
                <Text style={styles.urgencyText}>{requestItem.urgency}</Text>
              </View>
              <Text style={styles.itemCost}>
                ₹{((requestItem.material.estimatedCost || 0) * requestItem.quantity).toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.requestFooter}>
        <Text style={styles.totalCost}>
          Total: ₹{item.totalEstimatedCost.toLocaleString()}
        </Text>
        {item.approverNotes && (
          <Text style={styles.approverNotes}>Note: {item.approverNotes}</Text>
        )}
      </View>
    </View>
  );

  const renderMaterialItem = ({ item }: { item: MaterialItem }) => (
    <TouchableOpacity
      style={styles.materialItem}
      onPress={() => addMaterialToRequest(item)}
    >
      <View style={styles.materialInfo}>
        <Text style={styles.materialName}>{item.name}</Text>
        <Text style={styles.materialCategory}>{item.category}</Text>
        <Text style={styles.materialUnit}>Unit: {item.unit}</Text>
      </View>
      <View style={styles.materialCost}>
        <Text style={styles.costText}>₹{item.estimatedCost}</Text>
        <Ionicons name="add-circle" size={24} color="#4CAF50" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Material Requests</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowNewRequestModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.requestsList}
        refreshing={loading}
        onRefresh={loadMaterialRequests}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="construct" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No material requests yet</Text>
            <Text style={styles.emptySubtext}>Tap + to create your first request</Text>
          </View>
        }
      />

      {/* New Request Modal */}
      <Modal
        visible={showNewRequestModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNewRequestModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Material Request</Text>
            <TouchableOpacity
              onPress={submitMaterialRequest}
              disabled={newRequest.items.length === 0 || loading}
            >
              <Text style={[styles.submitButton, { 
                opacity: newRequest.items.length === 0 || loading ? 0.5 : 1 
              }]}>
                Submit
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Selected Items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Selected Materials</Text>
              {newRequest.items.length === 0 ? (
                <Text style={styles.noItemsText}>No materials selected</Text>
              ) : (
                newRequest.items.map((item, index) => (
                  <View key={index} style={styles.selectedItem}>
                    <View style={styles.selectedItemInfo}>
                      <Text style={styles.selectedItemName}>{item.material.name}</Text>
                      <Text style={styles.selectedItemCategory}>{item.material.category}</Text>
                    </View>
                    
                    <View style={styles.selectedItemControls}>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          onPress={() => updateItemQuantity(item.materialId, item.quantity - 1)}
                          style={styles.quantityButton}
                        >
                          <Ionicons name="remove" size={16} color="#666" />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                        <TouchableOpacity
                          onPress={() => updateItemQuantity(item.materialId, item.quantity + 1)}
                          style={styles.quantityButton}
                        >
                          <Ionicons name="add" size={16} color="#666" />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.urgencySelector}>
                        {(['low', 'medium', 'high', 'urgent'] as const).map((urgency) => (
                          <TouchableOpacity
                            key={urgency}
                            onPress={() => updateItemUrgency(item.materialId, urgency)}
                            style={[
                              styles.urgencyOption,
                              { backgroundColor: item.urgency === urgency ? getUrgencyColor(urgency) : '#f0f0f0' }
                            ]}
                          >
                            <Text style={[
                              styles.urgencyOptionText,
                              { color: item.urgency === urgency ? 'white' : '#666' }
                            ]}>
                              {urgency}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Add Materials Button */}
            <TouchableOpacity
              style={styles.addMaterialButton}
              onPress={() => setShowMaterialSelector(true)}
            >
              <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
              <Text style={styles.addMaterialText}>Add Materials</Text>
            </TouchableOpacity>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add any special instructions or notes..."
                multiline
                numberOfLines={3}
                value={newRequest.notes}
                onChangeText={(text) => setNewRequest(prev => ({ ...prev, notes: text }))}
              />
            </View>

            {/* Total Cost */}
            {newRequest.items.length > 0 && (
              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Estimated Total Cost:</Text>
                <Text style={styles.totalAmount}>
                  ₹{newRequest.items.reduce((total, item) => 
                    total + (item.material.estimatedCost || 0) * item.quantity, 0
                  ).toLocaleString()}
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Material Selector Modal */}
      <Modal
        visible={showMaterialSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowMaterialSelector(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Materials</Text>
            <View />
          </View>

          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search materials..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
              <TouchableOpacity
                style={[styles.categoryButton, { backgroundColor: !selectedCategory ? '#4CAF50' : '#f0f0f0' }]}
                onPress={() => setSelectedCategory('')}
              >
                <Text style={[styles.categoryButtonText, { color: !selectedCategory ? 'white' : '#666' }]}>
                  All
                </Text>
              </TouchableOpacity>
              {MATERIAL_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryButton, { 
                    backgroundColor: selectedCategory === category ? '#4CAF50' : '#f0f0f0' 
                  }]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[styles.categoryButtonText, { 
                    color: selectedCategory === category ? 'white' : '#666' 
                  }]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={filteredMaterials}
            renderItem={renderMaterialItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.materialsList}
          />
        </SafeAreaView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestsList: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  requestDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  requestItems: {
    marginBottom: 12,
  },
  requestItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemMeta: {
    alignItems: 'flex-end',
  },
  urgencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  urgencyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemCost: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  requestFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  totalCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'right',
  },
  approverNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  submitButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  noItemsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  selectedItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectedItemInfo: {
    marginBottom: 8,
  },
  selectedItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedItemCategory: {
    fontSize: 12,
    color: '#666',
  },
  selectedItemControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  urgencySelector: {
    flexDirection: 'row',
    gap: 4,
  },
  urgencyOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyOptionText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  addMaterialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  addMaterialText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 8,
  },
  notesInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  totalSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  searchSection: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 8,
    fontSize: 14,
  },
  categoryFilter: {
    flexDirection: 'row',
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  materialsList: {
    padding: 16,
  },
  materialItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  materialCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  materialUnit: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  materialCost: {
    alignItems: 'center',
  },
  costText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
});

export default MaterialRequestScreen;
