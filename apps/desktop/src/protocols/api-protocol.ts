import { net, protocol } from 'electron'


export const apiScheme = {
  scheme: 'api',
  privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true },
}

export function handleApiProtocol(backendBaseUrl: string) {
  protocol.handle('api', (request) => {
    const urlObj = new URL(request.url)
  
    let cleanPath = urlObj.pathname
    if (cleanPath.startsWith('/app/')) {
      cleanPath = cleanPath.replace('/app', '')
    }

    const target = new URL(`${cleanPath}${urlObj.search}`, backendBaseUrl)
 
    // Strip the Cookie header from the renderer request — it belongs to the
    // api:// origin and would override Electron's session cookie jar for the
    // backend's HTTP origin. net.fetch injects the stored cookies automatically.
    const headers = new Headers(request.headers);
    headers.delete('cookie');

    try {
      return net.fetch(target.toString(), {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body,
        duplex: 'half',
      } as RequestInit)
    } catch {
      return new Response(JSON.stringify({ error: 'API unreachable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  })
}