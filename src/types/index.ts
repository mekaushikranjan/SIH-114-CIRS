export interface MediaItem {
  uri: string;
  type: 'image' | 'video';
  duration?: number;
  width?: number;
  height?: number;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OTPVerification: undefined;
  EmailVerification: { email?: string; token?: string };
  PhoneVerification: { phoneNumber: string };
};

export type MainTabParamList = {
  Home: undefined;
  Issues: undefined;
  Alerts: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  Complaint: undefined;
  Department: { department: string };
  Community: undefined;
  Reports: undefined;
  TrackIssue: { issueId: string };
};

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'citizen' | 'admin';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  language: 'en' | 'hi' | 'bn';
  notifications: boolean;
  theme: 'light' | 'dark';
  locationSharing: boolean;
}

// Issue Types
export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  location: Location;
  media: MediaItem[];
  status: IssueStatus;
  upvotes: number;
  submittedBy: string;
  submittedAt: string;
  department: string;
  deadline?: string;
  assignedTo?: string;
  estimatedCompletion?: string;
  completedAt?: string;
  priority?: 'low' | 'medium' | 'high';
}

export type IssueStatus = 'pending' | 'submitted' | 'acknowledged' | 'assigned' | 'in_progress' | 'completed' | 'rejected';

export interface IssueTimeline {
  id: string;
  issueId: string;
  status: IssueStatus;
  title: string;
  description: string;
  timestamp: string;
  updatedBy: string;
  attachments?: string[];
}

// Department Types
export interface Department {
  id: string;
  name: string;
  description: string;
  categories: string[];
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  workingHours: string;
  averageResponseTime: number; // in hours
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  data?: any;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  expiresAt?: string;
}

export type NotificationType = 
  | 'issue_update' 
  | 'nearby_issue' 
  | 'announcement' 
  | 'deadline' 
  | 'community' 
  | 'system';

// API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface CreateIssueRequest {
  title: string;
  description: string;
  category: string;
  location: Location;
  media?: string[];
}

export interface UpdateIssueRequest {
  status?: IssueStatus;
  assignedTo?: string;
  deadline?: string;
  estimatedCompletion?: string;
  notes?: string;
}

// Chart Data Types
export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

export interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
}

// Community Types
export interface WordCloudItem {
  word: string;
  count: number;
  size: number;
}

export interface TrendingTopic {
  topic: string;
  issues: number;
  trend: 'up' | 'down' | 'stable';
}

export interface CommunityStats {
  activeCitizens: number;
  totalIssues: number;
  resolvedIssues: number;
  averageResolutionTime: number;
}

// Filter Types
export interface IssueFilters {
  category?: string;
  status?: IssueStatus;
  location?: {
    radius: number; // in km
    center: Location;
  };
  dateRange?: {
    start: string;
    end: string;
  };
  priority?: 'low' | 'medium' | 'high';
  sortBy?: 'date' | 'upvotes' | 'distance' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Form Types
export interface ComplaintFormData {
  title: string;
  description: string;
  category: string;
  location: Location | null;
  media: string[];
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

// Settings Types
export interface AppSettings {
  notifications: {
    issueUpdates: boolean;
    nearbyIssues: boolean;
    departmentAnnouncements: boolean;
    deadlineReminders: boolean;
    communityAlerts: boolean;
  };
  privacy: {
    shareLocation: boolean;
    showProfile: boolean;
    allowDataCollection: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'auto';
    language: 'en' | 'hi' | 'bn';
    fontSize: 'small' | 'medium' | 'large';
  };
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}
