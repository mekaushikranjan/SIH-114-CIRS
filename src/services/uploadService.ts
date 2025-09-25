// API Configuration - Use centralized config
import { apiService } from './apiService';
import { tokenStorage } from '../utils/tokenStorage';

export interface UploadResponse {
  success: boolean;
  data?: {
    workLog: any;
    uploadedFiles: Array<{
      filename: string;
      originalName: string;
      mimetype: string;
      size: number;
      url: string;
      cloudinary_url?: string;
      public_id?: string;
    }>;
    message: string;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface IssueMediaUploadResponse {
  success: boolean;
  data?: {
    uploadedMedia: Array<{
      filename: string;
      originalName: string;
      mimetype: string;
      size: number;
      url: string;
      cloudinary_url: string;
      public_id: string;
      type: 'image' | 'video';
    }>;
    images: Array<{
      url: string;
      public_id: string;
      filename: string;
    }>;
    videos: Array<{
      url: string;
      public_id: string;
      filename: string;
    }>;
    totalFiles: number;
    message: string;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface ProfileImageUploadResponse {
  success: boolean;
  data?: {
    profileImage: string;
    public_id: string;
    optimized_url: string;
    message: string;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface MediaFile {
  filename: string;
  originalName?: string;
  mimetype?: string;
  size?: number;
  url: string;
  timestamp: string;
  notes?: string;
}

export interface NotesResponse {
  success: boolean;
  data?: {
    assignmentId: string;
    notes: Array<{
      id: string;
      timestamp: string;
      action: string;
      notes: string;
      location?: any;
    }>;
    totalNotes: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

class UploadService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${apiService.getBaseURL()}/uploads`;
  }

  /**
   * Upload work progress photos/videos
   */
  async uploadWorkProgressMedia(
    assignmentId: string,
    files: Array<{ uri: string; type: string; name: string }>,
    notes?: string,
    location?: any,
    token?: string
  ): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      
      // Add files to form data
      files.forEach((file, index) => {
        formData.append('files', {
          uri: file.uri,
          type: file.type,
          name: file.name || `file_${index}.jpg`,
        } as any);
      });

      // Add optional fields
      if (notes) {
        formData.append('notes', notes);
      }
      
      if (location) {
        formData.append('location', JSON.stringify(location));
      }

      const response = await fetch(`${apiService.getBaseURL().replace('/api/v1', '')}/uploads/work-progress/${assignmentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Failed to upload files',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get work progress media for an assignment
   */
  async getWorkProgressMedia(
    assignmentId: string,
    token: string
  ): Promise<{ success: boolean; data?: { mediaFiles: MediaFile[]; totalFiles: number }; error?: any }> {
    try {
      const response = await fetch(`${apiService.getBaseURL().replace('/api/v1', '')}/uploads/work-progress/${assignmentId}/photos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get media error:', error);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch media files'
        }
      };
    }
  }

  /**
   * Add work notes without media
   */
  async addWorkNote(
    assignmentId: string,
    notes: string,
    location?: any,
    token?: string
  ): Promise<UploadResponse> {
    try {
      const response = await fetch(`${this.baseURL}/work-notes/${assignmentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes,
          location
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Add note error:', error);
      return {
        success: false,
        error: {
          code: 'NOTE_ERROR',
          message: 'Failed to add note',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get work notes for an assignment
   */
  async getWorkNotes(
    assignmentId: string,
    token: string
  ): Promise<NotesResponse> {
    try {
      const response = await fetch(`${this.baseURL}/work-notes/${assignmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get notes error:', error);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch notes'
        }
      };
    }
  }

  /**
   * Delete uploaded media file
   */
  async deleteWorkProgressMedia(
    assignmentId: string,
    filename: string,
    token: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const response = await fetch(`${this.baseURL}/work-progress/${assignmentId}/media/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Delete media error:', error);
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete media file'
        }
      };
    }
  }

  /**
   * Upload issue media (for complaint submissions)
   */
  async uploadIssueMedia(files: Array<{ uri: string; type: string; name: string }>, issueId?: string, notes?: string): Promise<IssueMediaUploadResponse> {
    try {
      const formData = new FormData();
      
      files.forEach((file, index) => {
        formData.append('media', {
          uri: file.uri,
          type: file.type,
          name: file.name || `media_${index}.jpg`,
        } as any);
      });

      if (issueId) {
        formData.append('issueId', issueId);
      }
      
      if (notes) {
        formData.append('notes', notes);
      }

      const response = await fetch(`${apiService.getBaseURL()}/uploads/issue-media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await tokenStorage.getToken()}`,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Upload failed');
      }

      return result;
    } catch (error) {
      console.error('Issue media upload error:', error);
      return {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to upload issue media'
        }
      };
    }
  }

  /**
   * Upload profile image
   */
  async uploadProfileImage(imageFile: { uri: string; type: string; name: string }): Promise<ProfileImageUploadResponse> {
    try {
      const formData = new FormData();
      
      formData.append('profileImage', {
        uri: imageFile.uri,
        type: imageFile.type,
        name: imageFile.name || 'profile.jpg',
      } as any);

      const response = await fetch(`${apiService.getBaseURL()}/uploads/profile-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await tokenStorage.getToken()}`,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Profile image upload failed');
      }

      return result;
    } catch (error) {
      console.error('Profile image upload error:', error);
      return {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to upload profile image'
        }
      };
    }
  }

  /**
   * Delete issue media from Cloudinary
   */
  async deleteIssueMedia(publicId: string): Promise<{ success: boolean; error?: { code: string; message: string } }> {
    try {
      const response = await fetch(`${apiService.getBaseURL()}/uploads/issue-media/${publicId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await tokenStorage.getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Delete failed');
      }

      return result;
    } catch (error) {
      console.error('Delete issue media error:', error);
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete media file'
        }
      };
    }
  }

  /**
   * Get media file URL for display (now handles both local and Cloudinary URLs)
   */
  getMediaUrl(filename: string): string {
    // If it's already a full URL (Cloudinary), return as is
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    
    // Otherwise, construct local URL (for backward compatibility)
    return `${apiService.getBaseURL().replace('/api/v1', '')}/uploads/work-progress/${filename}`;
  }

  /**
   * Check Cloudinary service health
   */
  async checkCloudinaryHealth(): Promise<{ success: boolean; status: string; usage?: any; error?: string }> {
    try {
      const response = await fetch(`${apiService.getBaseURL()}/uploads/health/cloudinary`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await tokenStorage.getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          status: 'disconnected',
          error: result.error?.message || 'Health check failed'
        };
      }

      return {
        success: true,
        status: result.data?.cloudinary_status || 'connected',
        usage: result.data?.usage
      };
    } catch (error) {
      console.error('Cloudinary health check error:', error);
      return {
        success: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: { uri: string; type: string; name: string; size?: number }): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/mov', 'video/avi', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported. Please use images (JPEG, PNG, GIF) or videos (MP4, MOV, AVI, WEBM).'
      };
    }

    // Check file size (50MB limit)
    if (file.size && file.size > 50 * 1024 * 1024) {
      return {
        valid: false,
        error: 'File size too large. Maximum size is 50MB.'
      };
    }

    return { valid: true };
  }

  /**
   * Prepare file for upload from camera/gallery
   */
  prepareFileForUpload(uri: string, type: string, name?: string): { uri: string; type: string; name: string } {
    const timestamp = Date.now();
    const extension = type.includes('image') ? 'jpg' : 'mp4';
    const fileName = name || `work_progress_${timestamp}.${extension}`;

    return {
      uri,
      type,
      name: fileName
    };
  }
}

export const uploadService = new UploadService();
export default uploadService;
