import { getCurrentConfig, FEATURE_FLAGS, debugLog } from '../config/environment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from '../utils/tokenStorage';

// API Configuration - Use environment config
const config = getCurrentConfig();

// Types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface DashboardStats {
  totalIssues: number;
  resolvedIssues: number;
  inProgressIssues: number;
  pendingIssues: number;
  averageResolutionTime: number;
  categoryStats: Array<{
    category: string;
    count: number;
    resolved: number;
  }>;
  districtStats: Array<{
    district: string;
    count: number;
    resolved: number;
  }>;
}

export interface UserProfile {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  phone: string;
  phoneNumber?: string;
  district: string;
  block: string;
  profileImage: string | null;
  profilePicture?: string | null;
  language: 'en' | 'hi';
  notificationsEnabled: boolean;
  role?: 'citizen' | 'groundworker' | 'admin' | 'CITIZEN' | 'ADMIN';
  emailVerified?: boolean;
  phoneVerified?: boolean;
  isActive?: boolean;
  twoFactorEnabled?: boolean;
  createdAt: string;
  lastLogin?: string;
  stats: {
    issuesReported: number;
    issuesResolved: number;
    upvotesGiven: number;
  };
}

export interface Issue {
  id: string;
  trackingNumber: string;
  category: string;
  subcategory: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  images: string[];
  videos: string[];
  upvotes: number;
  hasUserUpvoted: boolean;
  createdAt: string;
  updatedAt: string;
  timeline: Array<{
    status: string;
    message: string;
    timestamp: string;
  }>;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: Array<{
    id: string;
    name: string;
  }>;
}

// API Service Class
class ApiService {
  private baseURL: string;
  private timeout: number;
  private maxRetries = 1; // Reduced from 3 to 1
  private retryBaseDelayMs = 400;

  constructor() {
    this.baseURL = config.BASE_URL;
    this.timeout = config.TIMEOUT;
  }

  // Get the base URL for direct fetch calls
  getBaseURL(): string {
    return this.baseURL;
  }

  // Get the full URL for an endpoint
  getFullURL(endpoint: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseURL}/${cleanEndpoint}`;
  }

  // Get authentication token (unified via tokenStorage)
  private async getAuthToken(): Promise<string | null> {
    try {
      const token = await tokenStorage.getToken();
      if (token) {
        // Check for fallback/mock tokens and reject them
        if (token.startsWith('fallback_token') || token.startsWith('mock-') || token === 'test-token') {
          console.error('❌ Fallback/mock token detected, clearing auth data:', token.substring(0, 20) + '...');
          await tokenStorage.clearAuthData();
          return null;
        }
        
        // Validate token format (basic JWT structure check)
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.error('❌ Invalid token format - not a valid JWT:', token.substring(0, 20) + '...');
          // Clear the invalid token
          await tokenStorage.clearAuthData();
          return null;
        }
        
        // Additional validation: check if it looks like a real JWT
        try {
          const header = JSON.parse(atob(parts[0]));
          if (!header.alg || !header.typ) {
            console.error('❌ Invalid JWT header structure');
            await tokenStorage.clearAuthData();
            return null;
          }
        } catch (e) {
          console.error('❌ Cannot parse JWT header');
          await tokenStorage.clearAuthData();
          return null;
        }
        
        console.log('✅ Valid JWT token retrieved:', token.substring(0, 20) + '...');
      } else {
        console.log('❌ No token found in storage');
      }
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private buildHeaders = async (initHeaders?: HeadersInit, isJson: boolean = true): Promise<HeadersInit> => {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = { ...(initHeaders as Record<string, string>) };
    if (isJson && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  private shouldRetry(response: Response | null, error: any, attempt: number): boolean {
    if (attempt >= this.maxRetries) return false;
    if (error?.name === 'AbortError') return false; // timed out
    if (!response) return true; // network failure
    if (response.status === 429) return true;
    if (response.status >= 500 && response.status < 600) return true;
    // Don't retry on authentication errors (401, 403) or client errors (400-499)
    if (response && response.status >= 400 && response.status < 500) return false;
    return false;
  }

  private async exponentialBackoffDelay(attempt: number): Promise<void> {
    const jitter = Math.random() * 100;
    const delay = this.retryBaseDelayMs * Math.pow(2, attempt) + jitter;
    await new Promise((res) => setTimeout(res, delay));
  }

  // Generic API request method with retries, timeout, and JSON/multipart handling
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const requestId = Math.random().toString(36).slice(2);
    const url = `${this.baseURL}${endpoint}`;
    let attempt = 0;

    while (true) {
      let response: Response | null = null;
      try {
        const isFormData = options.body instanceof FormData;
        const headers = await this.buildHeaders(options.headers, !isFormData);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        debugLog(`HTTP ${options.method || 'GET'} → ${url} [${requestId}] attempt ${attempt + 1}`);
        console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);

        response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const isJsonResponse = (response.headers.get('content-type') || '').includes('application/json');
        const parsed = isJsonResponse ? await response.json() : await response.text();

        if (!response.ok) {
          const normalizedError = {
            code: (parsed as any)?.error?.code || `HTTP_${response.status}`,
            message: (parsed as any)?.error?.message || response.statusText || 'Request failed',
            details: (parsed as any)?.error?.details,
          };

          // Handle token-related errors
          if (response.status === 401 && (normalizedError.code === 'INVALID_TOKEN' || normalizedError.code === 'MALFORMED_TOKEN' || normalizedError.code === 'EXPIRED_TOKEN')) {
            console.log('🔄 Token error detected, clearing auth data');
            await tokenStorage.clearAuthData();
          }

          if (this.shouldRetry(response, null, attempt)) {
            attempt++;
            await this.exponentialBackoffDelay(attempt - 1);
            continue;
          }

          return { success: false, error: normalizedError };
        }

        const data = isJsonResponse ? (parsed as any)?.data ?? (parsed as any) : (parsed as any);
        return { success: true, data };
      } catch (error: any) {
        debugLog(`HTTP error ← ${url} [${requestId}]`, error?.message || error);
        if (this.shouldRetry(response, error, attempt)) {
          attempt++;
          await this.exponentialBackoffDelay(attempt - 1);
          continue;
        }
        return {
          success: false,
          error: {
            code: error?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
            message: error?.message || 'Network error occurred',
          },
        };
      }
    }
  }

  // Authentication APIs
  async login(email: string, password: string): Promise<ApiResponse<{ user: UserProfile; token: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Mock authentication for development (bypasses Firebase)
  async mockLogin(email: string, password: string): Promise<ApiResponse<{ user: UserProfile; token: string }>> {
    return this.request('/mock-auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Firebase token upsert/login (server-side user ensure)
  async firebaseLoginUpsert(): Promise<ApiResponse<{ user: UserProfile }>> {
    return this.request('/auth/firebase/login', {
      method: 'POST',
    });
  }

  async verifyOtp(email: string, otp: string): Promise<ApiResponse<{ user: UserProfile; token: string }>> {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async resendOtp(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async register(userData: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
    };
    departmentId: number | null;
  }): Promise<ApiResponse<{ user: UserProfile; token: string }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Google OAuth login
  async loginWithGoogle(idToken: string): Promise<ApiResponse<{ user: UserProfile; token: string }>> {
    return this.request('/auth/login/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  }

  // Password reset
  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Email verification
  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/auth/verify-email?token=${token}`, {
      method: 'GET',
    });
  }

  async resendEmailVerification(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Phone verification
  async sendPhoneOTP(phoneNumber: string): Promise<ApiResponse<{ messageId: string; expiresIn: number }>> {
    return this.request('/auth/send-phone-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async verifyPhoneOTP(phoneNumber: string, otp: string): Promise<ApiResponse<{ message: string; phoneVerified: boolean }>> {
    return this.request('/auth/verify-phone-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp }),
    });
  }

  // Session management
  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: UserProfile }>> {
    return this.request('/auth/me', {
      method: 'GET',
    });
  }

  // Dashboard APIs
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request('/dashboard/stats');
  }

  async getCommunityInsights(): Promise<ApiResponse<any>> {
    return this.request('/dashboard/insights');
  }

  // User Profile APIs
  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request('/user/profile');
  }

  async updateUserProfile(profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async uploadProfileImage(imageFile: FormData): Promise<ApiResponse<{ profileImage: string }>> {
    return this.request('/user/profile/image', {
      method: 'POST',
      // Content-Type must be omitted for FormData; handled automatically
      body: imageFile,
    });
  }

  // Issue Management APIs
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request('/issues/categories');
  }

  async reportIssue(issueData: FormData): Promise<ApiResponse<{ issueId: string; trackingNumber: string }>> {
    debugLog('Reporting issue to:', `${this.baseURL}/issues`);
    
    // Check if the form data contains videos for extended timeout
    let hasVideo = false;
    try {
      // Check if FormData has videos by checking if 'videos' key exists
      hasVideo = issueData.has('videos');
    } catch (error) {
      // Fallback: assume video if we can't check
      hasVideo = false;
    }
    
    // Use extended timeout for video uploads
    const originalTimeout = this.timeout;
    if (hasVideo) {
      this.timeout = 120000; // 2 minutes for video uploads
      debugLog('Extended timeout for video upload:', this.timeout);
    }
    
    try {
      const result = await this.request<{ issueId: string; trackingNumber: string }>('/issues', {
        method: 'POST',
        body: issueData,
      });
      return result;
    } finally {
      // Restore original timeout
      this.timeout = originalTimeout;
    }
  }

  async getUserIssues(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ issues: Issue[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/issues/my-issues${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getIssueDetails(issueId: string): Promise<ApiResponse<any>> {
    const endpoint = `/issues/${issueId}/details`;
    console.log('🔍 getIssueDetails calling endpoint:', endpoint);
    return this.request(endpoint);
  }

  async getWorkerIssueDetails(issueId: string): Promise<ApiResponse<any>> {
    const endpoint = `/workers/issues/${issueId}/details`;
    console.log('🔍 getWorkerIssueDetails calling endpoint:', endpoint);
    return this.request(endpoint);
  }

  async addIssueRating(issueId: string, rating: number, comment?: string): Promise<ApiResponse<any>> {
    const endpoint = `/issues/${issueId}/rating`;
    console.log('⭐ addIssueRating calling endpoint:', endpoint);
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ rating, comment })
    });
  }

  async getDepartmentIssues(category: string, params?: {
    status?: string;
    district?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ issues: Issue[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.district) queryParams.append('district', params.district);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/issues/department/${category}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }


  async getIssueAnalytics(): Promise<ApiResponse<any>> {
    const endpoint = `/analytics/issues`;
    return this.request(endpoint);
  }

  async voteOnIssue(issueId: string, action: 'upvote' | 'downvote' | 'remove'): Promise<ApiResponse<any>> {
    return this.request(`/issues/${issueId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  // Notifications APIs
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');

    const endpoint = `/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<any>> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  // Alerts APIs
  async getPublicAlerts(): Promise<ApiResponse<any[]>> {
    return this.request('/alerts/public');
  }

  async markAlertAsRead(alertId: string): Promise<ApiResponse<any>> {
    return this.request(`/alerts/${alertId}/read`, { method: 'POST' });
  }

  // Announcements APIs
  async getAnnouncements(params?: {
    page?: number;
    limit?: number;
    priority?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.priority) queryParams.append('priority', params.priority);

    const endpoint = `/announcements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  // Location APIs
  async getDistricts(): Promise<ApiResponse<any>> {
    return this.request('/locations/districts');
  }

  async reverseGeocode(lat: number, lng: number): Promise<ApiResponse<any>> {
    return this.request(`/locations/reverse-geocode?lat=${lat}&lng=${lng}`);
  }

  // Support APIs
  async submitSupportRequest(data: {
    subject: string;
    message: string;
    category: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/support/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitFeedback(data: {
    rating: number;
    feedback: string;
    category: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/support/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Worker APIs
  async getWorkerProfile(workerId: string): Promise<ApiResponse<{ worker: any; performance?: any }>> {
    // Return full payload so consumers can access performance too
    return this.request(`/workers/profile/${workerId}`, { method: 'GET' });
  }

  async updateWorkerProfile(workerId: string, profileData: any): Promise<ApiResponse<any>> {
    const result = await this.request(`/workers/profile/${workerId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });

    if (result.success) {
      // The backend returns { worker, message }. Normalize to just worker.
      const data: any = (result as any).data;
      if (data && data.worker) {
        return { success: true, data: data.worker } as any;
      }
    }

    return result as any;
  }
  async getWorkerDashboard(workerId: string): Promise<ApiResponse<{
    worker: {
      id: string;
      workerId: string;
      name: string;
      department: string;
      rating: number;
      completedIssues: number;
    };
    stats: {
      totalAssigned: number;
      todayAssigned: number;
      inProgress: number;
      completed: number;
      pending: number;
    };
    priorityIssues: Array<{
      id: string;
      issueId: string;
      priority: 'high' | 'medium' | 'low';
      issue: {
        title: string;
        location: string;
        category: string;
      };
    }>;
    recentActivity: any[];
  }>> {
    return this.request(`/workers/dashboard/${workerId}`);
  }

  async getWorkerAssignments(workerId: string, params?: {
    status?: string;
    priority?: string;
  }): Promise<ApiResponse<{
    assignments: Array<{
      id: string;
      issueId: string;
      workerId: string;
      status: string;
      priority: string;
      assignedAt: string;
      startedAt?: string;
      completedAt?: string;
      estimatedDuration: number;
      actualDuration?: number;
      issue: {
        id: number;
        title: string;
        description: string;
        category: string;
        location: string;
        coordinates?: {
          latitude: number;
          longitude: number;
        };
        images: string[];
        videos: string[];
        reportedBy: string;
        reportedAt: string;
      };
    }>;
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);

    const endpoint = `/workers/assignments/${workerId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async startWorkOnAssignment(assignmentId: string, location: any): Promise<ApiResponse<any>> {
    // Note: This method now uses the work-progress endpoint which expects issueId
    // The assignmentId parameter should actually be the issueId
    return this.request(`/work-progress/start`, {
      method: 'POST',
      body: JSON.stringify({ 
        issueId: assignmentId, // Treating assignmentId as issueId for work sessions
        location,
        estimatedDuration: 4, // Default estimated duration in hours
        notes: 'Work started via mobile app'
      }),
    });
  }

  async completeWorkOnAssignment(assignmentId: string, notes: string, photos: any[], location: any): Promise<ApiResponse<any>> {
    return this.request(`/workers/assignments/${assignmentId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes, photos, location }),
    });
  }

  async updateWorkProgress(assignmentId: string, formData: FormData): Promise<ApiResponse<any>> {
    return this.request(`/workers/assignments/${assignmentId}/progress`, {
      method: 'POST',
      body: formData,
    });
  }

  // ========================================
  // PUBLIC ISSUES & UPVOTING METHODS
  // ========================================

  async getPublicIssues(params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    category?: string;
    sort?: 'recent' | 'popular' | 'oldest';
    excludeStatuses?: string[];
  } = {}): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.category) queryParams.append('category', params.category);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.excludeStatuses && params.excludeStatuses.length > 0) {
      params.excludeStatuses.forEach(status => {
        queryParams.append('excludeStatus', status);
      });
    }

    return this.request(`/issues/public?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  async getPopularIssues(): Promise<ApiResponse<any>> {
    return this.request('/issues/popular', {
      method: 'GET',
    });
  }

  async upvoteIssue(issueId: string): Promise<ApiResponse<any>> {
    return this.request(`/issues/${issueId}/upvote`, {
      method: 'POST',
    });
  }

  async getUpvoteStatus(issueIds: string[]): Promise<ApiResponse<any>> {
    return this.request('/issues/upvote-status', {
      method: 'POST',
      body: JSON.stringify({ issueIds }),
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Helper functions for common operations
export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('auth_token');
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};
