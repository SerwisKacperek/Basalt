import { app, BrowserWindow, protocol } from 'electron'
import path from 'path'

import { appScheme, handleAppProtocol } from './protocols/app-protocol'
import { apiScheme, handleApiProtocol } from './protocols/api-protocol'
import { vaultScheme, handleVaultProtocol } from './protocols/app-protocol'

const devServerUrl = process.env.VITE_DEV_SERVER_URL
const isDev = !!devServerUrl

protocol.registerSchemesAsPrivileged([appScheme, apiScheme, vaultScheme])

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
    win.webContents.openDevTools({ mode: 'detach' })
  }
}

app.whenReady().then(() => {
  const vaultRoot = path.join(app.getPath('userData'), 'vault')

  handleAppProtocol(path.join(__dirname, 'web'))
  handleApiProtocol()
  handleVaultProtocol(vaultRoot)

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
