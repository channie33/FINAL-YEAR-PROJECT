/**
 * API Utilities Reference Guide
 * 
 * All API functions automatically include JWT token in Authorization header
 * All functions return a Promise that resolves to a response object
 */

// ============= AUTHENTICATION FUNCTIONS =============

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} Response with user info
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
 * @param {number} userId - User ID
 * @param {string} userType - 'student', 'professional', or 'admin'
 * @param {string} otpCode - 6-digit OTP code
 * @returns {Promise} Response with JWT token
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
 * @param {string} email - Email address
 * @param {string} password - Password
 * @param {string} userType - 'student' or 'professional'
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {Promise} Response
 */
async function register(email, password, userType, firstName, lastName) {
    return apiPost('/api/register', 
        { email, password, user_type: userType, first_name: firstName, last_name: lastName }, 
        { includeAuth: false }
    );
}

/**
 * Logout and clear authentication
 */
function logout() {
    clearAuth();
    window.location.href = '/shared/login.html';
}

// ============= TOKEN MANAGEMENT =============

/**
 * Store JWT token in localStorage
 * @param {string} token - JWT token
 */
function setAuthToken(token) {
    if (token) {
        localStorage.setItem(API_CONFIG.tokenStorageKey, token);
    } else {
        localStorage.removeItem(API_CONFIG.tokenStorageKey);
    }
}

/**
 * Retrieve JWT token from localStorage
 * @returns {string|null} JWT token or null if not authenticated
 */
function getAuthToken() {
    return localStorage.getItem(API_CONFIG.tokenStorageKey);
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if token exists
 */
function isAuthenticated() {
    return !!getAuthToken();
}

// ============= USER INFO MANAGEMENT =============

/**
 * Store user information in localStorage
 * @param {Object} userInfo - User information object
 */
function setUserInfo(userInfo) {
    if (userInfo) {
        localStorage.setItem(API_CONFIG.userStorageKey, JSON.stringify(userInfo));
    } else {
        localStorage.removeItem(API_CONFIG.userStorageKey);
    }
}

/**
 * Retrieve user information from localStorage
 * @returns {Object|null} User information or null
 */
function getUserInfo() {
    const userInfo = localStorage.getItem(API_CONFIG.userStorageKey);
    return userInfo ? JSON.parse(userInfo) : null;
}

/**
 * Clear all authentication data
 */
function clearAuth() {
    setAuthToken(null);
    setUserInfo(null);
}

// ============= HTTP REQUEST FUNCTIONS =============

/**
 * GET request (automatically includes JWT token)
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Additional options
 * @returns {Promise} Response object
 * 
 * @example
 * const data = await apiGet('/api/student/profile?student_id=1');
 */
function apiGet(endpoint, options = {}) {
    return apiRequest(endpoint, { method: 'GET', ...options });
}

/**
 * POST request with JSON body (automatically includes JWT token)
 * @param {string} endpoint - API endpoint path
 * @param {Object} body - Request body
 * @param {Object} options - Additional options
 * @returns {Promise} Response object
 * 
 * @example
 * const response = await apiPost('/api/messages', { 
 *     student_id: 1, 
 *     professional_id: 2, 
 *     message: 'Hello' 
 * });
 */
function apiPost(endpoint, body, options = {}) {
    return apiRequest(endpoint, { method: 'POST', body, ...options });
}

/**
 * PUT request with JSON body (automatically includes JWT token)
 * @param {string} endpoint - API endpoint path
 * @param {Object} body - Request body
 * @param {Object} options - Additional options
 * @returns {Promise} Response object
 */
function apiPut(endpoint, body, options = {}) {
    return apiRequest(endpoint, { method: 'PUT', body, ...options });
}

/**
 * DELETE request (automatically includes JWT token)
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Additional options
 * @returns {Promise} Response object
 */
function apiDelete(endpoint, options = {}) {
    return apiRequest(endpoint, { method: 'DELETE', ...options });
}

/**
 * POST request with FormData (for file uploads, automatically includes JWT token)
 * @param {string} endpoint - API endpoint path
 * @param {FormData} formData - FormData object with files
 * @param {Object} options - Additional options
 * @returns {Promise} Response object
 * 
 * @example
 * const formData = new FormData();
 * formData.append('file', fileInput.files[0]);
 * formData.append('user_id', userId);
 * formData.append('specialization', 'Mental Health');
 * 
 * const response = await apiPostFormData('/api/submit-verification', formData);
 */
function apiPostFormData(endpoint, formData, options = {}) {
    return apiRequest(endpoint, { method: 'POST', body: formData, isFormData: true, ...options });
}

// ============= RESPONSE HANDLING =============

/**
 * All API functions return response objects with this structure:
 * {
 *     status: 'success' or 'error',
 *     message: 'Human readable message',
 *     data: { ... } // Additional data if applicable
 * }
 * 
 * On 401 Unauthorized: Automatically clears auth and redirects to login
 * On network error: Returns error object with message
 */

// ============= USAGE EXAMPLES =============

/**
 * Example 1: Login Flow
 */
async function exampleLogin() {
    const response = await login('user@example.com', 'Password123!');
    if (response.status === 'success') {
        console.log('Login successful');
    } else {
        console.error('Login failed:', response.message);
    }
}

/**
 * Example 2: Get Student Profile (authenticated)
 */
async function exampleGetProfile() {
    const userId = getUserInfo().user_id;
    const response = await apiGet(`/api/student/profile?student_id=${userId}`);
    if (response.status === 'success') {
        console.log('Profile:', response.data);
    }
}

/**
 * Example 3: Send Message (authenticated)
 */
async function exampleSendMessage() {
    const response = await apiPost('/api/messages', {
        student_id: 1,
        professional_id: 2,
        message: 'Hello, how can you help me?'
    });
    
    if (response.status === 'success') {
        console.log('Message sent');
    } else {
        console.error('Failed to send message:', response.message);
    }
}

/**
 * Example 4: File Upload (authenticated)
 */
async function exampleFileUpload(fileInput) {
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('user_id', getUserInfo().user_id);
    formData.append('specialization', 'Clinical Psychology');
    
    const response = await apiPostFormData('/api/submit-verification', formData);
    
    if (response.status === 'success') {
        console.log('File uploaded successfully');
    } else {
        console.error('Upload failed:', response.message);
    }
}

/**
 * Example 5: Check Authentication
 */
function exampleCheckAuth() {
    if (isAuthenticated()) {
        const user = getUserInfo();
        console.log('Logged in as:', user.email);
    } else {
        console.log('Not authenticated');
        window.location.href = '/assets/pages/shared/login.html';
    }
}

/**
 * Example 6: Logout
 */
function exampleLogout() {
    logout(); // Clears auth and redirects to login page
}

// ============= IMPORTANT NOTES =============

/*
1. All functions automatically include JWT token in Authorization header
2. All functions automatically handle 401 (Unauthorized) by redirecting to login
3. Include <script src="/assets/js/utils/api.js"></script> before using these functions
4. Never store sensitive data in localStorage except the JWT token
5. JWT token expires after 24 hours - users must login again
6. For file uploads, use FormData and apiPostFormData()
7. For non-authenticated endpoints, pass { includeAuth: false } option
*/
