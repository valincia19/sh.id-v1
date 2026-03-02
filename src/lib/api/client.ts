import axios, { AxiosInstance, AxiosError } from "axios";

// ============================================
// API Client Configuration
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT as string, 10) || 15000;

// ============================================
// CSRF Token Management
// ============================================
let csrfToken: string | null = null;

/**
 * Fetch and cache CSRF token from the server
 */
export const fetchCsrfToken = async (): Promise<string> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/csrf-token`, {
      withCredentials: true,
    });
    const token = response.data.data.csrfToken as string;
    csrfToken = token;
    return token;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    throw error;
  }
};

/**
 * Get the current CSRF token, fetching if necessary
 */
export const getCsrfToken = async (): Promise<string> => {
  if (!csrfToken) {
    return fetchCsrfToken();
  }
  return csrfToken;
};

/**
 * Clear the cached CSRF token (call on logout)
 */
export const clearCsrfToken = (): void => {
  csrfToken = null;
};

// ============================================
// Create Axios Instance
// ============================================

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
  // CRITICAL: This ensures HttpOnly cookies are automatically sent to the backend
  withCredentials: true,
});

// ============================================
// Request Interceptor - Add CSRF token to mutating requests
// ============================================
apiClient.interceptors.request.use(
  (config) => {
    // Add CSRF token to all non-GET requests
    if (csrfToken && !['get', 'GET', 'head', 'HEAD', 'options', 'OPTIONS'].includes(config.method || '')) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// Response Interceptor (Global Error Handling ONLY)
// ============================================

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // If we receive a 401, the user is unauthenticated.
    // We optionally dispatch an event to log the user out of the UI
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event('auth-unauthorized'));
      }
    }
    
    // If CSRF token is invalid/expired, fetch a new one and retry once
    if (error.response?.status === 403) {
      const data = error.response?.data as { code?: string };
      if (data?.code?.startsWith('CSRF_')) {
        try {
          await fetchCsrfToken();
          // Retry the original request once
          const config = error.config;
          if (config && config.headers) {
            config.headers['X-CSRF-Token'] = csrfToken;
            return apiClient.request(config);
          }
        } catch {
          // If refresh fails, just reject
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// API Error Handler
// ============================================

export interface ApiError {
  message: string;
  error?: string;
  statusCode?: number;
  details?: Array<{ field?: string; message?: string; path?: string; msg?: string; }>;
}

export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;

    if (axiosError.response) {
      const errorData = axiosError.response.data;
      let message = errorData?.message || "An error occurred";

      if (errorData?.details && errorData.details.length > 0) {
        const fieldErrors = errorData.details
          .map((d) => `${d.path || d.field}: ${d.msg || d.message}`)
          .join(", ");
        message = `${message} (${fieldErrors})`;
      }

      return {
        message,
        error: errorData?.error || "Error",
        statusCode: axiosError.response.status,
        details: errorData?.details,
      };
    } else if (axiosError.request) {
      return { message: "No response from server. Please check your connection.", error: "NetworkError", statusCode: 0 };
    }
  }

  return { message: error instanceof Error ? error.message : "An unexpected error occurred", error: "UnknownError" };
};

export default apiClient;
