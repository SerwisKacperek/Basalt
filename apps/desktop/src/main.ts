import { config as loadDotenv } from 'dotenv';
import { app, BrowserWindow, nativeImage, protocol, session } from 'electron';
import path from 'path';

loadDotenv();

import { appScheme, handleAppProtocol } from './protocols/app-protocol';
import { apiScheme, handleApiProtocol } from './protocols/api-protocol';
import { vaultScheme, handleVaultProtocol } from './protocols/vault-protocol';
import { basaltFileScheme, handleBasaltFileProtocol } from './protocols/basalt-file.protocol';
import { createMainRegistry } from './services/registry';
import { registerIpc } from './services/ipc-main';

const devServerUrl = process.env.VITE_DEV_SERVER_URL
const isDev = !!devServerUrl

protocol.registerSchemesAsPrivileged([appScheme, apiScheme, vaultScheme, basaltFileScheme])

function getWindowIcon(): Electron.NativeImage | string | undefined {
	if (process.platform === 'darwin') {
		return undefined;
	}

	const assetsPath = app.isPackaged
	? path.join(process.resourcesPath, 'assets')
	: path.join(__dirname, '../assets');

	const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
	const iconPath = path.join(assetsPath, iconName);

	return nativeImage.createFromPath(iconPath);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: getWindowIcon(),
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
  const apiBase = (() => {
    const base = process.env.API_URL ?? 'http://localhost';
    const port = process.env.API_PORT;
    if (port && !/:\d+$/.test(base)) return `${base}:${port}`;
    return base;
  })();

  await session.defaultSession.clearStorageData({
    storages: ['serviceworkers', 'cachestorage'],
  })

  const webRoot = path.join(__dirname, 'web')
  const vaultRoot = path.join(app.getPath('userData'), 'vault')

  handleAppProtocol(webRoot)
  handleApiProtocol(apiBase)
  handleVaultProtocol(vaultRoot)
  handleBasaltFileProtocol()


  registerIpc(createMainRegistry(vaultRoot))

  createWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})
