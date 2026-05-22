import { app, BrowserWindow, protocol } from 'electron'
import path from 'path'
import { appScheme, handleAppProtocol } from './protocols/app-protocol'
import { apiScheme, handleApiProtocol } from './protocols/api-protocol'

const devServerUrl = process.env.VITE_DEV_SERVER_URL
const isDev = !!devServerUrl

protocol.registerSchemesAsPrivileged([appScheme, apiScheme])

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
  handleApiProtocol()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
