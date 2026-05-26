import { net, protocol } from 'electron'
import { existsSync, statSync } from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
 
export const vaultScheme = {
  scheme: 'vault',
  privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true },
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
 