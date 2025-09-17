// ProgressMark API Tester
class APITester {
    constructor() {
        this.baseURL = 'http://localhost:3000/api/v1';
        this.accessToken = localStorage.getItem('accessToken');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateAuthStatus();
        this.loadSavedCredentials();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('apiForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.makeRequest();
        });

        // Login button
        document.getElementById('loginBtn')?.addEventListener('click', () => {
            this.login();
        });

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });

        // Clear button
        document.getElementById('clearBtn')?.addEventListener('click', () => {
            this.clearForm();
        });

        // Method change
        document.getElementById('method')?.addEventListener('change', (e) => {
            this.updateMethodStyles(e.target.value);
        });
    }

    async login() {
        const credentials = {
            email: 'ngthnhvuong@gmail.com',
            password: 'vuongvuive123'
        };

        try {
            this.showLoading('loginBtn', 'Logging in...');
            
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (data.ok) {
                this.accessToken = data.data.tokens.accessToken;
                localStorage.setItem('accessToken', this.accessToken);
                this.updateAuthStatus();
                this.showSuccess('Login successful!');
            } else {
                this.showError('Login failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            this.showError('Login failed: ' + error.message);
        } finally {
            this.hideLoading('loginBtn', 'Login');
        }
    }

    logout() {
        this.accessToken = null;
        localStorage.removeItem('accessToken');
        this.updateAuthStatus();
        this.showSuccess('Logged out successfully!');
    }

    updateAuthStatus() {
        const authStatus = document.getElementById('authStatus');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        if (this.accessToken) {
            authStatus.textContent = 'Authenticated';
            authStatus.className = 'text-success';
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
        } else {
            authStatus.textContent = 'Not authenticated';
            authStatus.className = 'text-danger';
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
        }
    }

    async makeRequest() {
        const method = document.getElementById('method').value;
        const endpoint = document.getElementById('endpoint').value;
        const headersText = document.getElementById('headers').value;
        const bodyText = document.getElementById('body').value;

        if (!endpoint) {
            this.showError('Please enter an endpoint');
            return;
        }

        try {
            this.showLoading('submit', 'Sending...');
            this.hideResponse();

            // Parse headers
            let headers = {
                'Content-Type': 'application/json'
            };

            if (this.accessToken) {
                headers['Authorization'] = `Bearer ${this.accessToken}`;
            }

            if (headersText.trim()) {
                try {
                    const customHeaders = JSON.parse(headersText);
                    headers = { ...headers, ...customHeaders };
                } catch (e) {
                    this.showError('Invalid JSON in headers');
                    return;
                }
            }

            // Parse body
            let body = null;
            if (bodyText.trim() && ['POST', 'PUT', 'PATCH'].includes(method)) {
                try {
                    body = JSON.stringify(JSON.parse(bodyText));
                } catch (e) {
                    this.showError('Invalid JSON in request body');
                    return;
                }
            }

            // Make request
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: method,
                headers: headers,
                body: body
            });

            const responseData = await response.text();
            let parsedData;

            try {
                parsedData = JSON.parse(responseData);
            } catch (e) {
                parsedData = responseData;
            }

            this.showResponse(response.status, response.statusText, parsedData);

        } catch (error) {
            this.showError('Request failed: ' + error.message);
        } finally {
            this.hideLoading('submit', 'Send Request');
        }
    }

    showResponse(status, statusText, data) {
        const statusElement = document.getElementById('responseStatus');
        const statusBadge = document.getElementById('statusBadge');
        const statusTextElement = document.getElementById('statusText');
        const responseContent = document.getElementById('responseContent');
        const responseBody = document.getElementById('responseBody');
        const noResponse = document.getElementById('noResponse');

        // Update status
        statusBadge.textContent = status;
        statusBadge.className = `badge ${status >= 200 && status < 300 ? 'bg-success' : 'bg-danger'}`;
        statusTextElement.textContent = statusText;
        statusElement.style.display = 'block';

        // Update response body
        responseBody.textContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
        responseContent.style.display = 'block';
        noResponse.style.display = 'none';
    }

    hideResponse() {
        document.getElementById('responseStatus').style.display = 'none';
        document.getElementById('responseContent').style.display = 'none';
        document.getElementById('noResponse').style.display = 'block';
    }

    clearForm() {
        document.getElementById('apiForm').reset();
        document.getElementById('headers').value = '{"Content-Type": "application/json"}';
        this.hideResponse();
    }

    updateMethodStyles(method) {
        const methodSelect = document.getElementById('method');
        methodSelect.className = `form-select method-${method.toLowerCase()}`;
    }

    showLoading(buttonId, loadingText) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = true;
            button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${loadingText}`;
        }
    }

    hideLoading(buttonId, originalText) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'danger');
    }

    showAlert(message, type) {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert-temporary');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show alert-temporary`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert at the top of the form
        const form = document.getElementById('apiForm');
        form.parentNode.insertBefore(alert, form);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    loadSavedCredentials() {
        // Load saved headers if any
        const savedHeaders = localStorage.getItem('apiTesterHeaders');
        if (savedHeaders) {
            document.getElementById('headers').value = savedHeaders;
        } else {
            document.getElementById('headers').value = '{"Content-Type": "application/json"}';
        }
    }

    saveCredentials() {
        const headers = document.getElementById('headers').value;
        localStorage.setItem('apiTesterHeaders', headers);
    }
}

// Copy response function
function copyResponse() {
    const responseBody = document.getElementById('responseBody');
    const text = responseBody.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        // Show temporary success message
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="bi bi-check me-1"></i>Copied!';
        button.className = 'btn btn-sm btn-success';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.className = 'btn btn-sm btn-outline-light';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// Initialize API Tester when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('apiForm')) {
        new APITester();
    }
});

// Save credentials on form change
document.addEventListener('input', function(e) {
    if (e.target.id === 'headers') {
        localStorage.setItem('apiTesterHeaders', e.target.value);
    }
});