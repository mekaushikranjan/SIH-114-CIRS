import { useState, useEffect } from 'react';
import { apiService, ApiResponse } from '../services/apiService';

// Custom hook for API data fetching with loading and error states
export const useApiData = <T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCall();
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch data');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
};

// Hook for dashboard statistics
export const useDashboardStats = () => {
  return useApiData(() => apiService.getDashboardStats());
};

// Hook for user profile
export const useUserProfile = () => {
  return useApiData(() => apiService.getUserProfile());
};

// Hook for user issues
export const useUserIssues = (params?: { status?: string; page?: number; limit?: number }) => {
  return useApiData(() => apiService.getUserIssues(params), [params]);
};

// Hook for categories
export const useCategories = () => {
  return useApiData(() => apiService.getCategories());
};

// Hook for department issues
export const useDepartmentIssues = (
  category: string,
  params?: { status?: string; district?: string; page?: number; limit?: number }
) => {
  return useApiData(() => apiService.getDepartmentIssues(category, params), [category, params]);
};

// Hook for notifications
export const useNotifications = (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
  return useApiData(() => apiService.getNotifications(params), [params]);
};

// Hook for announcements
export const useAnnouncements = (params?: { page?: number; limit?: number; priority?: string }) => {
  return useApiData(() => apiService.getAnnouncements(params), [params]);
};
