import { net, protocol } from 'electron'
import { existsSync, statSync } from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

export function registerAppScheme() {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } },
    { scheme: 'api', privileges: { secure: true, standard: true, supportFetchAPI: true } },
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

export function handleApiProtocol(webRoot: string) {
  protocol.handle('api',  (request) => {
    const { pathname, search } = new URL(request.url)
    const target = `${webRoot}${pathname}${search}`
    
    try {
      return net.fetch(target, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      })
    } catch {
      return new Response(JSON.stringify({ error: "API unreachable"}), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  })
}
