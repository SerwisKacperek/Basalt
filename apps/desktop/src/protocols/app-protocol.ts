import { net, protocol } from 'electron'
import { existsSync, statSync } from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

export function registerAppScheme() {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } },
    { scheme: 'vault', privileges: { secure: true, standard: true, supportFetchAPI: true } },
  ])
}

export function handleAppProtocol(webRoot: string) {
  const root = path.resolve(webRoot)

  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url)

    // Decode percent-encoding before path resolution to block encoded traversal
    const relative = decodeURIComponent(pathname).replace(/^\/+/, '')
    const resolved = path.resolve(root, relative)

    // Path-traversal guard: resolved path must be inside webRoot
    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
      return new Response(null, { status: 403 })
    }

    if (existsSync(resolved) && !statSync(resolved).isDirectory()) {
      return net.fetch(pathToFileURL(resolved).toString())
    }

    return net.fetch(pathToFileURL(path.join(root, 'index.html')).toString())
  })
}

export function handleVaultProtocol(vaultRoot: string) {
  const root = path.resolve(vaultRoot)

  protocol.handle('vault', (request) => {
    const { pathname } = new URL(request.url)
    const relative = decodeURIComponent(pathname).replace(/^\/+/, '')
    const resolved = path.resolve(root, relative)

    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
      return new Response(null, { status: 403 })
    }

    if (existsSync(resolved) && !statSync(resolved).isDirectory()) {
      return net.fetch(pathToFileURL(resolved).toString())
    }

    return new Response(null, { status: 404 })
  })
}