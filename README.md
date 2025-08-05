# 📚 Cuaderno Digital

A modern, cross-device digital notebook application with real-time synchronization and multiple themes.

## ✨ Features

- 🔐 **User Authentication** - Secure login and registration
- 📱 **Cross-Device Sync** - Access your notes from anywhere
- 🎨 **Multiple Themes** - 8 themes
- 📝 **Rich Note Taking** - Support for different note types
- ⭐ **Favorites System** - Mark important notes
- 🔍 **Search & Filter** - Find notes quickly
- 📊 **Statistics** - Track your note-taking progress
- 🌙 **Dark/Light Mode** - Easy on the eyes
- 📱 **Responsive Design** - Works on all devices

## 🚀 Deploy on DanBotHosting

### Step 1: Upload Files

1. Upload all files to your DBH server via FTP/SFTP
2. Make sure `package.json` and `server.js` are in the root directory

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start the Application

```bash
npm start
```

### Step 4: Configure Domain

- Set up your domain/subdomain to point to your DBH server
- The app will run on the port specified in your DBH panel (it may not detect it, so you may need to change the port manually in server.js)

## 🛠️ Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/PinkLittleKitty/Escriba
   cd Escriba
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## � DanBoctHosting Setup

### File Structure

```
project-folder/
├── server.js          # Main server file
├── package.json       # Dependencies
├── index.html         # Main app page
├── auth.html          # Login/register page
├── script.js          # Main app logic
├── api.js             # API client
├── styles.css         # All styles
└── cuaderno.db        # SQLite database (created automatically)
```

### Database

- Uses SQLite database stored as `cuaderno.db`
- Database and tables are created automatically on first run
- No additional database setup required

### Troubleshooting

- Make sure Node.js is enabled in your DBH panel
- Check that all files uploaded correctly
- Verify `npm install` completed without errors
- Check DBH console for any error messages

## 🎨 Themes

- 🌙 **Dark** - Neutral dark theme
- ☀️ **Light** - Clean bright theme  
- 💙 **Blue** - Professional blue tones
- 🏫 **UNQ** - inspired by Universidad Nacional de Quilmes
- 🌲 **Forest** - Natural green tones
- 🌅 **Sunset** - Warm orange and pink
- 🌊 **Ocean** - Deep blue and teal
- 🤖 **Cyberpunk** - Neon matrix style

## 🔧 API Endpoints

### Authentication

- `POST /api/register` - Create new user account
- `POST /api/login` - User login

### Data Management

- `GET /api/subjects` - Get user's subjects
- `POST /api/subjects` - Create new subject
- `GET /api/notes` - Get user's notes
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Settings

- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the GitHub Issues page
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

---