
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "QUEENS CHAMBERS Management Portal",
    icon: path.join(__dirname, 'icon.ico'), // Ensure you have an icon file
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // In production, this would load the built index.html
  win.loadFile('index.html');
  
  // Optional: Maximize on start
  win.maximize();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
