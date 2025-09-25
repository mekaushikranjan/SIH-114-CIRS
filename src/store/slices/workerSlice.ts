import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WorkerAssignment {
  id: string;
  issueId: string;
  workerId: string;
  assignedAt: string;
  status: 'assigned' | 'in-progress' | 'completed' | 'on-hold';
  priority: 'low' | 'medium' | 'high';
  estimatedDuration?: number; // in hours
  actualDuration?: number; // in hours
  startedAt?: string;
  completedAt?: string;
}

export interface WorkProgress {
  issueId: string;
  workerId: string;
  status: 'not_started' | 'in_progress' | 'paused' | 'completed';
  startTime?: string;
  endTime?: string;
  notes: string[];
  photos: string[];
  location?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
}

export interface WorkerStats {
  totalAssigned: number;
  inProgress: number;
  completed: number;
  avgResponseTime: number; // in hours
  completionRate: number; // percentage
  rating: number; // 1-5 stars
}

interface WorkerState {
  assignments: WorkerAssignment[];
  activeWork: WorkProgress[];
  stats: WorkerStats;
  loading: boolean;
  error: string | null;
  assignmentsLastFetch: string | null;
  assignmentsFilter: {
    status: 'all' | 'assigned' | 'in-progress' | 'completed';
    priority: 'all' | 'low' | 'medium' | 'high';
    searchQuery: string;
  };
}

const initialState: WorkerState = {
  assignments: [],
  activeWork: [],
  stats: {
    totalAssigned: 0,
    inProgress: 0,
    completed: 0,
    avgResponseTime: 0,
    completionRate: 0,
    rating: 0,
  },
  loading: false,
  error: null,
  assignmentsLastFetch: null,
  assignmentsFilter: {
    status: 'all',
    priority: 'all',
    searchQuery: '',
  },
};

const workerSlice = createSlice({
  name: 'worker',
  initialState,
  reducers: {
    // Assignment management
    setAssignments: (state, action: PayloadAction<WorkerAssignment[]>) => {
      state.assignments = action.payload;
      state.assignmentsLastFetch = new Date().toISOString();
    },
    
    updateAssignment: (state, action: PayloadAction<{ id: string; updates: Partial<WorkerAssignment> }>) => {
      const { id, updates } = action.payload;
      const index = state.assignments.findIndex(a => a.id === id);
      if (index !== -1) {
        state.assignments[index] = { ...state.assignments[index], ...updates };
      }
    },
    
    addAssignment: (state, action: PayloadAction<WorkerAssignment>) => {
      state.assignments.unshift(action.payload);
    },
    
    removeAssignment: (state, action: PayloadAction<string>) => {
      state.assignments = state.assignments.filter(a => a.id !== action.payload);
    },
    
    setAssignmentsFilter: (state, action: PayloadAction<Partial<WorkerState['assignmentsFilter']>>) => {
      state.assignmentsFilter = { ...state.assignmentsFilter, ...action.payload };
    },
    
    clearAssignmentsFilter: (state) => {
      state.assignmentsFilter = {
        status: 'all',
        priority: 'all',
        searchQuery: '',
      };
    },
    updateAssignmentStatus: (state, action: PayloadAction<{ id: string; status: WorkerAssignment['status'] }>) => {
      const assignment = state.assignments.find(a => a.id === action.payload.id);
      if (assignment) {
        assignment.status = action.payload.status;
      }
    },
    
    // Work progress management
    startWork: (state, action: PayloadAction<{ assignmentId: string; issueId: string; workerId: string; location?: any }>) => {
      const { assignmentId, issueId, workerId, location } = action.payload;
      
      // Update assignment status
      const targetAssignment = state.assignments.find(a => a.id === assignmentId);
      if (targetAssignment) {
        targetAssignment.status = 'in-progress';
        targetAssignment.startedAt = new Date().toISOString();
      }
      const existingWork = state.activeWork.find(w => w.issueId === issueId);
      
      if (existingWork) {
        existingWork.status = 'in_progress';
        existingWork.startTime = new Date().toISOString();
        if (location) existingWork.location = location;
      } else {
        state.activeWork.push({
          issueId,
          workerId,
          status: 'in_progress',
          startTime: new Date().toISOString(),
          photos: [],
          notes: [],
          location,
        });
      }
      
      // Update assignment status
      const assignment = state.assignments.find(a => a.issueId === issueId);
      if (assignment) {
        assignment.status = 'in-progress';
        assignment.startedAt = new Date().toISOString();
      }
    },
    
    completeWork: (state, action: PayloadAction<{ assignmentId: string; issueId: string; notes?: string; photos?: string[]; location?: any }>) => {
      const { assignmentId, issueId, notes, photos, location } = action.payload;
      const work = state.activeWork.find(w => w.issueId === issueId);
      
      if (work) {
        work.status = 'completed';
        work.endTime = new Date().toISOString();
        if (notes) work.notes.push(notes);
        if (photos) work.photos.push(...photos);
        if (location) work.location = location;
      }
      
      // Update assignment status
      const workAssignment = state.assignments.find(a => a.id === assignmentId);
      if (workAssignment) {
        workAssignment.status = 'completed';
        workAssignment.completedAt = new Date().toISOString();
      }
    },
    
    pauseWork: (state, action: PayloadAction<{ issueId: string; reason?: string }>) => {
      const { issueId, reason } = action.payload;
      const work = state.activeWork.find(w => w.issueId === issueId);
      
      if (work) {
        work.status = 'paused';
        if (reason) {
          work.notes.push(`Work paused: ${reason}`);
        }
      }
    },
    
    addWorkPhoto: (state, action: PayloadAction<{ issueId: string; photoUrl: string }>) => {
      const work = state.activeWork.find(w => w.issueId === action.payload.issueId);
      if (work) {
        work.photos.push(action.payload.photoUrl);
      }
    },
    
    addWorkNote: (state, action: PayloadAction<{ issueId: string; note: string }>) => {
      const work = state.activeWork.find(w => w.issueId === action.payload.issueId);
      if (work) {
        work.notes.push(action.payload.note);
      }
    },
    
    updateWorkLocation: (state, action: PayloadAction<{ issueId: string; location: any }>) => {
      const work = state.activeWork.find(w => w.issueId === action.payload.issueId);
      if (work) {
        work.location = action.payload.location;
      }
    },
    
    // Stats management
    setWorkerStats: (state, action: PayloadAction<WorkerStats>) => {
      state.stats = action.payload;
    },
    
    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Clear worker data (on logout)
    clearWorkerData: (state) => {
      state.assignments = [];
      state.activeWork = [];
      state.stats = {
        totalAssigned: 0,
        inProgress: 0,
        completed: 0,
        avgResponseTime: 0,
        completionRate: 0,
        rating: 0,
      };
      state.error = null;
      state.assignmentsLastFetch = null;
      state.assignmentsFilter = {
        status: 'all',
        priority: 'all',
        searchQuery: '',
      };
    },
  },
});

export const { 
  setAssignments,
  updateAssignment,
  addAssignment, 
  removeAssignment,
  setAssignmentsFilter,
  clearAssignmentsFilter,
  updateAssignmentStatus, 
  startWork,
  completeWork,
  pauseWork,
  addWorkNote,
  addWorkPhoto,
  updateWorkLocation,
  setWorkerStats, 
  setLoading, 
  setError, 
  clearWorkerData 
} = workerSlice.actions;

export default workerSlice.reducer;
