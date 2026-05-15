import { app, BrowserWindow } from 'electron'
import path from 'path'
import { handleApiProtocol, handleAppProtocol, registerAppScheme } from './protocols/app-protocol'

const isDev = process.env.DEV === 'false'

registerAppScheme()

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadURL('app://-/');
  }
}

app.whenReady().then(() => {
  const webRoot = app.isPackaged
    ? path.join(process.resourcesPath, 'web')
    : path.join(__dirname, '../../web/dist')

  const apiBase = isDev ? 'http://localhost:3000' : process.env.API_URL ?? 'http://localhost:3000';
  handleAppProtocol(webRoot)
  handleApiProtocol(apiBase)
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
