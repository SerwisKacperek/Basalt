import { net, protocol } from 'electron'

const backendBaseUrl = process.env.VITE_BACKEND_URL ?? process.env.BACKEND_URL ?? 'http://localhost:3000'

export const apiScheme = {
  scheme: 'api',
  privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true },
}

export function handleApiProtocol() {
  protocol.handle('api', (request) => {
    const url = new URL(request.url)
    const target = new URL(`${url.pathname}${url.search}`, backendBaseUrl)

    return net.fetch(target.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body,
      duplex: 'half',
    } as RequestInit)
  })
}
