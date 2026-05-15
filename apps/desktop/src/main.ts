import { app, BrowserWindow } from 'electron'
import path from 'path'
import { handleAppProtocol, registerAppScheme, handleVaultProtocol } from './protocols/app-protocol'

const isDev = process.env.DEV === 'true'

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
  } else {
    win.loadURL('app://-/')
  }
}

app.whenReady().then(() => {
  const webRoot = app.isPackaged
    ? path.join(process.resourcesPath, 'web')
    : path.join(__dirname, 'web')

  
  const vaultRoot = path.join(app.getPath('userData'), 'vault')
  handleAppProtocol(webRoot)
  handleVaultProtocol(vaultRoot)
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
