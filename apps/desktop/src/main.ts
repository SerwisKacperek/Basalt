import { app, BrowserWindow, protocol } from 'electron'
import path from 'path'

import { appScheme, handleAppProtocol } from './protocols/app-protocol'
import { apiScheme, handleApiProtocol } from './protocols/api-protocol'
import { vaultScheme, handleVaultProtocol } from './protocols/vault-protocol'

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
  }
}

app.whenReady().then(() => {
  const apiBase = isDev ? 'http://localhost:3000' : process.env.API_URL ?? 'http://localhost:3000';

  const webRoot = path.join(__dirname, 'web')
  const vaultRoot = path.join(app.getPath('userData'), 'vault')
  
  handleAppProtocol(webRoot)
  handleApiProtocol(apiBase)
  handleVaultProtocol(vaultRoot)
  
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
