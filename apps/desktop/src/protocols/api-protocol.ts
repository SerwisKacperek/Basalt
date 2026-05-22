import { net, protocol } from 'electron'


export const apiScheme = {
  scheme: 'api',
  privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true },
}

export function handleApiProtocol(backendBaseUrl: string) {
  protocol.handle('api', (request) => {
    const { pathname, search } = new URL(request.url)
    const target = new URL(`${pathname}${search}`, backendBaseUrl)
 
    try {
      return net.fetch(target.toString(), {
        method: request.method,
        headers: request.headers,
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
 