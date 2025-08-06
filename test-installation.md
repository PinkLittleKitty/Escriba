# Testing the Escriba Icon Installation

## Steps to verify the icon is working:

### 1. Install the Application
- Navigate to the `dist` folder
- Double-click `Escriba Setup 1.0.0.exe`
- Follow the installation wizard
- The installer itself should show the Escriba icon

### 2. Check Installed Application
After installation, check these locations:
- **Desktop shortcut**: Should have the Escriba icon
- **Start Menu**: Search for "Escriba" - the app should show with the icon
- **Installed location**: Usually `C:\Users\[Username]\AppData\Local\Programs\escriba\`

### 3. Run the Installed App
- Launch Escriba from the Start Menu or desktop shortcut
- The taskbar icon should show the Escriba icon
- The window title bar should show the icon

### 4. If Icons Don't Appear
Sometimes Windows needs to refresh its icon cache:

1. **Run as Administrator**: Open Command Prompt as admin and run:
   ```cmd
   ie4uinit.exe -show
   taskkill /f /im explorer.exe
   start explorer.exe
   ```

2. **Or use the batch file**: Run `refresh-icons.bat` as administrator

3. **Restart the computer**: This forces Windows to rebuild the icon cache

### 5. Verify Icon Files
The following icon files should exist in the `assets` folder:
- `icon.ico` - Main Windows icon file
- `icon.png` - 256x256 PNG version
- `icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-256.png` - Various sizes

## Troubleshooting

If the icon still doesn't appear:
1. The ICO file might be corrupted - regenerate with `node generate-icons.js`
2. Windows might be caching the old icon - try the refresh steps above
3. Some antivirus software can interfere with icon embedding

## Success Indicators
✅ Installer shows Escriba icon
✅ Desktop shortcut has Escriba icon  
✅ Start Menu entry has Escriba icon
✅ Running app shows icon in taskbar
✅ Window title bar shows icon