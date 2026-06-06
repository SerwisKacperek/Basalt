import { app, BrowserWindow, protocol, session } from 'electron'
import path from 'path'

import { appScheme, handleAppProtocol } from './protocols/app-protocol'
import { apiScheme, handleApiProtocol } from './protocols/api-protocol'
import { vaultScheme, handleVaultProtocol } from './protocols/vault-protocol'
import { createMainRegistry } from './services/registry'
import { registerIpc } from './services/ipc-main'

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

app.whenReady().then(async () => {
  const apiBase = isDev
    ? 'http://localhost'
    : process.env.API_URL ?? 'http://localhost';

  await session.defaultSession.clearStorageData({
    storages: ['serviceworkers', 'cachestorage'],
  })

  const webRoot = path.join(__dirname, 'web')
  const vaultRoot = path.join(app.getPath('userData'), 'vault')

  handleAppProtocol(webRoot)
  handleApiProtocol(apiBase)
  handleVaultProtocol(vaultRoot)


  registerIpc(createMainRegistry(vaultRoot))

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
