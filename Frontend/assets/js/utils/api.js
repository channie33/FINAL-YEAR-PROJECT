/**
 * API Utility Module
 * Handles all API requests with JWT authentication
 */

// API Configuration
const API_CONFIG = {
    baseURL: window.location.origin,
    tokenStorageKey: 'auth_token',
    userStorageKey: 'user_info'
};

/**
 * Store authentication token
 */
function setAuthToken(token) {
    if (token) {
        localStorage.setItem(API_CONFIG.tokenStorageKey, token);
    } else {
        localStorage.removeItem(API_CONFIG.tokenStorageKey);
    }
}

/**
 * Get authentication token
 */
function getAuthToken() {
    return localStorage.getItem(API_CONFIG.tokenStorageKey);
}

/**
 * Store user information
 */
function setUserInfo(userInfo) {
    if (userInfo) {
        localStorage.setItem(API_CONFIG.userStorageKey, JSON.stringify(userInfo));
    } else {
        localStorage.removeItem(API_CONFIG.userStorageKey);
    }
}

/**
 * Get user information
 */
function getUserInfo() {
    const userInfo = localStorage.getItem(API_CONFIG.userStorageKey);
    return userInfo ? JSON.parse(userInfo) : null;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!getAuthToken();
}

/**
 * Clear authentication
 */
function clearAuth() {
    setAuthToken(null);
    setUserInfo(null);
}

/**
 * Build request headers with authentication
 */
function buildHeaders(headers = {}, includeAuth = true) {
    const finalHeaders = {
        'Content-Type': 'application/json',
        ...headers
    };
    
    if (includeAuth) {
        const token = getAuthToken();
        if (token) {
            finalHeaders['Authorization'] = `Bearer ${token}`;
        }
    }
    
    return finalHeaders;
}

/**
 * Generic API request function
 */
async function apiRequest(endpoint, options = {}) {
    const {
        method = 'GET',
        body = null,
        headers = {},
        includeAuth = true,
        isFormData = false
    } = options;

    const url = `${API_CONFIG.baseURL}${endpoint}`;
    const finalHeaders = buildHeaders(headers, includeAuth);
    
    const fetchOptions = {
        method,
        headers: finalHeaders
    };

    if (body) {
        if (isFormData) {
            // For FormData, don't set Content-Type (browser will set it with boundary)
            delete fetchOptions.headers['Content-Type'];
            fetchOptions.body = body;
        } else {
            fetchOptions.body = JSON.stringify(body);
        }
    }

    try {
        const response = await fetch(url, fetchOptions);
        
        // Handle 401 Unauthorized - clear auth and redirect to login
        if (response.status === 401) {
            clearAuth();
            window.location.href = '/shared/login.html';
            return { status: 'error', message: 'Unauthorized. Please login again.' };
        }

        const data = await response.json();

        if (!response.ok) {
            return {
                status: 'error',
                message: data.message || `HTTP ${response.status}`,
                ...data
            };
        }

        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        return {
            status: 'error',
            message: 'Network error: ' + error.message
        };
    }
}

/**
 * GET request
 */
function apiGet(endpoint, options = {}) {
    return apiRequest(endpoint, { method: 'GET', ...options });
}

/**
 * POST request
 */
function apiPost(endpoint, body, options = {}) {
    return apiRequest(endpoint, { method: 'POST', body, ...options });
}

/**
 * PUT request
 */
function apiPut(endpoint, body, options = {}) {
    return apiRequest(endpoint, { method: 'PUT', body, ...options });
}

/**
 * DELETE request
 */
function apiDelete(endpoint, options = {}) {
    return apiRequest(endpoint, { method: 'DELETE', ...options });
}

/**
 * POST with FormData (for file uploads)
 */
function apiPostFormData(endpoint, formData, options = {}) {
    return apiRequest(endpoint, { method: 'POST', body: formData, isFormData: true, ...options });
}

/**
 * Login and store token
 */
async function login(email, password) {
    const response = await apiPost('/api/login', { email, password }, { includeAuth: false });
    if (response.status === 'success' && response.user) {
        setUserInfo(response.user);
    }
    return response;
}

/**
 * Verify OTP and get JWT token
 */
async function verifyOTP(userId, userType, otpCode) {
    const response = await apiPost('/api/verify-otp', 
        { user_id: userId, user_type: userType, otp_code: otpCode }, 
        { includeAuth: false }
    );
    
    if (response.status === 'success' && response.token) {
        setAuthToken(response.token);
        setUserInfo({ user_id: userId, user_type: userType });
    }
    return response;
}

/**
 * Register new user
 */
async function register(email, password, userType, firstName, lastName) {
    return apiPost('/api/register', 
        { 
            email, 
            password, 
            user_type: userType, 
            first_name: firstName, 
            last_name: lastName 
        }, 
        { includeAuth: false }
    );
}

/**
 * Logout
 */
function logout() {
    clearAuth();
    window.location.href = '/shared/login.html';
}
