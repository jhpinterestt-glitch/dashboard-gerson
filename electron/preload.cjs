const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  saveFile: (filename, base64Content) => ipcRenderer.invoke("save-file", filename, base64Content)
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('Gerson Gomes Advocacia: Contexto carregado de forma segura.');
});
