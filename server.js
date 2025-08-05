const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cuaderno-digital-secret-key-change-this';

app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100 
});
app.use('/api/', limiter);

const db = new sqlite3.Database('./cuaderno.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT DEFAULT 'note',
        favorite BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        theme TEXT DEFAULT 'dark',
        font_family TEXT DEFAULT 'Inter',
        font_size INTEGER DEFAULT 16,
        auto_save BOOLEAN DEFAULT 1,
        expand_subjects BOOLEAN DEFAULT 1,
        show_welcome BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, hashedPassword],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Username or email already exists' });
                    }
                    return res.status(500).json({ error: 'Failed to create user' });
                }

                db.run(
                    'INSERT INTO user_settings (user_id) VALUES (?)',
                    [this.lastID]
                );

                const token = jwt.sign({ userId: this.lastID, username }, JWT_SECRET, { expiresIn: '7d' });
                res.json({ token, user: { id: this.lastID, username, email } });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        db.get(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username],
            async (err, user) => {
                if (err) {
                    return res.status(500).json({ error: 'Server error' });
                }

                if (!user || !(await bcrypt.compare(password, user.password_hash))) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
                res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/subjects', authenticateToken, (req, res) => {
    db.all(
        'SELECT * FROM subjects WHERE user_id = ? ORDER BY created_at ASC',
        [req.user.userId],
        (err, subjects) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch subjects' });
            }
            res.json(subjects);
        }
    );
});

app.post('/api/subjects', authenticateToken, (req, res) => {
    const { name, color } = req.body;
    
    if (!name || !color) {
        return res.status(400).json({ error: 'Name and color are required' });
    }

    db.run(
        'INSERT INTO subjects (user_id, name, color) VALUES (?, ?, ?)',
        [req.user.userId, name, color],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to create subject' });
            }
            res.json({ id: this.lastID, name, color, created_at: new Date().toISOString() });
        }
    );
});

app.get('/api/notes', authenticateToken, (req, res) => {
    const { subject_id } = req.query;
    
    let query = 'SELECT * FROM notes WHERE user_id = ?';
    let params = [req.user.userId];
    
    if (subject_id) {
        query += ' AND subject_id = ?';
        params.push(subject_id);
    }
    
    query += ' ORDER BY updated_at DESC';

    db.all(query, params, (err, notes) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch notes' });
        }
        res.json(notes);
    });
});

app.post('/api/notes', authenticateToken, (req, res) => {
    const { subject_id, title, content, type = 'note' } = req.body;
    
    if (!subject_id || !title) {
        return res.status(400).json({ error: 'Subject ID and title are required' });
    }

    db.run(
        'INSERT INTO notes (user_id, subject_id, title, content, type) VALUES (?, ?, ?, ?, ?)',
        [req.user.userId, subject_id, title, content || '', type],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to create note' });
            }
            res.json({ 
                id: this.lastID, 
                subject_id, 
                title, 
                content: content || '', 
                type,
                favorite: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }
    );
});

app.put('/api/notes/:id', authenticateToken, (req, res) => {
    const { title, content, favorite } = req.body;
    const noteId = req.params.id;

    db.run(
        'UPDATE notes SET title = ?, content = ?, favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
        [title, content, favorite ? 1 : 0, noteId, req.user.userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update note' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Note not found' });
            }
            res.json({ success: true });
        }
    );
});

app.delete('/api/notes/:id', authenticateToken, (req, res) => {
    const noteId = req.params.id;

    db.run(
        'DELETE FROM notes WHERE id = ? AND user_id = ?',
        [noteId, req.user.userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete note' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Note not found' });
            }
            res.json({ success: true });
        }
    );
});

app.get('/api/settings', authenticateToken, (req, res) => {
    db.get(
        'SELECT * FROM user_settings WHERE user_id = ?',
        [req.user.userId],
        (err, settings) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch settings' });
            }
            res.json(settings || {});
        }
    );
});

app.put('/api/settings', authenticateToken, (req, res) => {
    const { theme, font_family, font_size, auto_save, expand_subjects, show_welcome } = req.body;

    db.run(
        `INSERT OR REPLACE INTO user_settings 
         (user_id, theme, font_family, font_size, auto_save, expand_subjects, show_welcome, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [req.user.userId, theme, font_family, font_size, auto_save ? 1 : 0, expand_subjects ? 1 : 0, show_welcome ? 1 : 0],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update settings' });
            }
            res.json({ success: true });
        }
    );
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/auth.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth.html'));
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Cuaderno Digital running on port ${PORT}`);
    console.log(`📝 Visit: http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('✅ Database closed.');
        }
        process.exit(0);
    });
});