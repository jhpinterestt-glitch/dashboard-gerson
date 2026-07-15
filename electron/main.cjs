const { app, BrowserWindow, Menu, session, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const isDev = process.env.NODE_ENV === "development";

// Ocultar menu padrão cedo para otimizar tempo de inicialização da janela
Menu.setApplicationMenu(null);

let mainWindow;
let splashWindow;

function createWindows() {
  // Criar janela de Splash Screen (sem moldura e centralizada)
  splashWindow = new BrowserWindow({
    width: 450,
    height: 380,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    icon: path.join(__dirname, "../src-tauri/icons/icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.loadFile(path.join(__dirname, "splash.html"));
  splashWindow.center();

  // Criar janela principal oculta (show: false)
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 1100,
    minHeight: 680,
    show: false,
    icon: path.join(__dirname, "../src-tauri/icons/icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
    title: "Gerson Gomes — Advocacia e Consultoria Jurídica",
    backgroundColor: "#0d0e12"
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:8080");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Quando a página da janela principal estiver pronta para exibição
  mainWindow.once("ready-to-show", () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
    mainWindow.show();
    mainWindow.focus();

    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });
}

app.whenReady().then(() => {
  // Bloquear e negar explicitamente qualquer solicitação ou verificação de geolocalização
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === "geolocation") {
      return callback(false);
    }
    callback(true);
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission, origin) => {
    if (permission === "geolocation") {
      return false;
    }
    return true;
  });

  ipcMain.handle("save-file", async (event, filename, base64Content) => {
    try {
      const { filePath } = await dialog.showSaveDialog({
        defaultPath: filename,
      });
      if (filePath) {
        const buffer = Buffer.from(base64Content, 'base64');
        fs.writeFileSync(filePath, buffer);
        return filePath;
      }
      return null;
    } catch (err) {
      console.error("Erro ao salvar arquivo via Electron:", err);
      throw err;
    }
  });

  createWindows();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindows();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
