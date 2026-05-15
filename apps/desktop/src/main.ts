import { app, BrowserWindow, webContents } from 'electron'
import path from 'path'
import { handleAppProtocol, registerAppScheme, handleVaultProtocol } from './protocols/app-protocol'
import { existsSync, mkdirSync } from 'fs'

const isDev = process.env.DEV === 'false'

registerAppScheme()

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
     win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadURL('app://-/')
    win.webContents.openDevTools({ mode: 'detach' })
  }
}

app.whenReady().then(() => {
  const webRoot = app.isPackaged
    ? path.join(process.resourcesPath, 'web')
    : path.join(__dirname, 'web')

  
  const vaultRoot = path.join(app.getPath('userData'), 'vault')
  if (!existsSync(vaultRoot)) {
    mkdirSync(vaultRoot, { recursive: true });
  }
  handleAppProtocol(webRoot)
  handleVaultProtocol(vaultRoot)
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
