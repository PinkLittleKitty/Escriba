class ApiClient {
    constructor() {
        this.baseURL = window.location.origin + '/api';
        this.token = localStorage.getItem('authToken');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            
            if (error.message.includes('Invalid or expired token')) {
                this.logout();
                window.location.reload();
            }
            
            throw error;
        }
    }

    async register(username, email, password) {
        const data = await this.request('/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        
        this.token = data.token;
        localStorage.setItem('authToken', this.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        return data;
    }

    async login(username, password) {
        const data = await this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        this.token = data.token;
        localStorage.setItem('authToken', this.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        return data;
    }

    logout() {
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    isAuthenticated() {
        return !!this.token;
    }

    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    async getSubjects() {
        return await this.request('/subjects');
    }

    async createSubject(name, color) {
        return await this.request('/subjects', {
            method: 'POST',
            body: JSON.stringify({ name, color })
        });
    }

    async getNotes(subjectId = null) {
        const query = subjectId ? `?subject_id=${subjectId}` : '';
        return await this.request(`/notes${query}`);
    }

    async createNote(subjectId, title, content = '', type = 'note') {
        return await this.request('/notes', {
            method: 'POST',
            body: JSON.stringify({ subject_id: subjectId, title, content, type })
        });
    }

    async updateNote(noteId, title, content, favorite = false) {
        return await this.request(`/notes/${noteId}`, {
            method: 'PUT',
            body: JSON.stringify({ title, content, favorite })
        });
    }

    async deleteNote(noteId) {
        return await this.request(`/notes/${noteId}`, {
            method: 'DELETE'
        });
    }

    async getSettings() {
        return await this.request('/settings');
    }

    async updateSettings(settings) {
        return await this.request('/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }
}

window.api = new ApiClient();