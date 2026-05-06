import { app, BrowserWindow, protocol, net } from 'electron'
import path from 'path'
import { pathToFileURL } from 'url'
import { existsSync, statSync } from 'fs'

const isDev = process.env.DEV === 'true'

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } }
])

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

  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url)
    const filePath = path.join(webRoot, pathname)

    if (existsSync(filePath) && !statSync(filePath).isDirectory()) {
      return net.fetch(pathToFileURL(filePath).toString())
    }

    return net.fetch(pathToFileURL(path.join(webRoot, 'index.html')).toString())
  })

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
