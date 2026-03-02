import { envConfig } from '@/lib/config/env';
import apiClient, { handleApiError, clearCsrfToken } from './client';

export interface RegisterData {
  username: string;
  email?: string;
  password: string;
  displayName?: string;
}

export interface LoginData {
  identifier: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  bio?: string | null;
  emailVerified: boolean;
  accountStatus: string;
  roles: string[];
  permissions?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
}

export interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const register = async (data: RegisterData): Promise<{ user: User }> => {
  try {
    const response = await apiClient.post('/auth/register', data);
    return response.data.data;
  } catch (error) { throw handleApiError(error); }
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/auth/login', data);
    return response.data.data;
  } catch (error) { throw handleApiError(error); }
};

export const logout = async (): Promise<void> => {
  try {
    // Backend clears the HttpOnly cookie
    await apiClient.post('/auth/logout');
  } catch (error) {
    // Ignore error
  } finally {
    // Clear the cached CSRF token
    clearCsrfToken();
  }
};

/**
 * THE CRITICAL ADDITION: Fetch Session (Replaces getStoredUser and isAuthenticated)
 */
export const getMe = async (): Promise<{ user: User }> => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  } catch (error) { throw handleApiError(error); }
};

export const updateProfile = async (data: UpdateProfileData): Promise<{ user: User }> => {
  try {
    const response = await apiClient.put('/auth/me', data);
    return response.data.data;
  } catch (error) { throw handleApiError(error); }
};

export const uploadAvatar = async (file: File): Promise<{ user: User; avatarUrl: string }> => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post('/auth/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  } catch (error) { throw handleApiError(error); }
};

export const changePassword = async (data: ChangePasswordData): Promise<void> => {
  try {
    await apiClient.post('/auth/change-password', data);
  } catch (error) { throw handleApiError(error); }
};

/**
 * Discord OAuth login
 */
export const loginWithDiscord = (): void => {
  if (typeof window === 'undefined') return;
  const apiUrl = envConfig.apiBaseUrl;
  window.location.href = `${apiUrl}/auth/discord`;
};

export const authApi = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  uploadAvatar,
  changePassword,
  loginWithDiscord
};

export default authApi;
