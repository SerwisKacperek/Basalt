import { app, BrowserWindow } from 'electron'
import path from 'path'
import { handleAppProtocol, registerAppScheme } from './protocols/app-protocol'

const devServerUrl = process.env.VITE_DEV_SERVER_URL
const isDev = !!devServerUrl

registerAppScheme()

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (isDev) {
    win.loadURL(devServerUrl)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadURL('app://-/')
  }
}

app.whenReady().then(() => {
  handleAppProtocol(path.join(__dirname, 'web'))
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
