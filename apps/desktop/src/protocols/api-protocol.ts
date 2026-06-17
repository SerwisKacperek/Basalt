import { net, protocol, session } from 'electron'


export const apiScheme = {
  scheme: 'api',
  privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true },
}

function parseSetCookieHeader(header: string): Electron.CookiesSetDetails | null {
  const parts = header.split(';').map(p => p.trim())
  const [nameValue, ...attrs] = parts
  const eqIdx = nameValue.indexOf('=')
  if (eqIdx === -1) return null

  const name = nameValue.substring(0, eqIdx).trim()
  const value = nameValue.substring(eqIdx + 1).trim()

  let httpOnly = false
  let secure = false
  let maxAge: number | undefined
  let path = '/'
  let sameSite: 'unspecified' | 'no_restriction' | 'lax' | 'strict' = 'lax'

  for (const attr of attrs) {
    const lower = attr.toLowerCase()
    if (lower === 'httponly') httpOnly = true
    else if (lower === 'secure') secure = true
    else if (lower.startsWith('max-age=')) {
      const ma = parseInt(attr.substring(8), 10)
      if (!isNaN(ma)) maxAge = ma
    } else if (lower.startsWith('path=')) {
      path = attr.substring(5)
    } else if (lower.startsWith('samesite=')) {
      const ss = attr.substring(9).toLowerCase()
      if (ss === 'none') sameSite = 'no_restriction'
      else if (ss === 'strict') sameSite = 'strict'
      else sameSite = 'lax'
    }
  }

  return {
    url: '', // filled by caller
    name,
    value,
    httpOnly,
    secure,
    path,
    sameSite,
    ...(maxAge !== undefined && { expirationDate: Math.floor(Date.now() / 1000) + maxAge }),
  }
}

export function handleApiProtocol(backendBaseUrl: string) {
  protocol.handle('api', async (request) => {
    const urlObj = new URL(request.url)

    let cleanPath = urlObj.pathname
    if (cleanPath.startsWith('/app/')) {
      cleanPath = cleanPath.replace('/app', '')
    }

    const target = new URL(`${cleanPath}${urlObj.search}`, backendBaseUrl)

    // Strip the Cookie header from the renderer request — it belongs to the
    // api:// origin and would override Electron's session cookie jar for the
    // backend's HTTP origin.
    const headers = new Headers(request.headers)
    headers.delete('cookie')

    // Inject session cookies for the backend origin. net.fetch from the main
    // process has no top-level site context, so SameSite=Lax cookies may not
    // be sent implicitly. Injecting them explicitly bypasses that restriction.
    const sessionCookies = await session.defaultSession.cookies.get({ url: backendBaseUrl })
    if (sessionCookies.length > 0) {
      headers.set('cookie', sessionCookies.map(c => `${c.name}=${c.value}`).join('; '))
    }

    try {
      const response = await net.fetch(target.toString(), {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body,
        duplex: 'half',
      } as RequestInit)

      // Explicitly persist any Set-Cookie values into the session cookie jar.
      // net.fetch may not store cookies when called without a first-party site
      // context. Storing them explicitly ensures they survive app restarts
      // (defaultSession persists to disk in userData).
      const setCookieHeaders: string[] =
        typeof (response.headers as any).getSetCookie === 'function'
          ? (response.headers as any).getSetCookie()
          : [response.headers.get('set-cookie')].filter(Boolean) as string[]

      for (const raw of setCookieHeaders) {
        const parsed = parseSetCookieHeader(raw)
        if (parsed) {
          parsed.url = backendBaseUrl
          await session.defaultSession.cookies.set(parsed).catch(() => {})
        }
      }

      return response
    } catch {
      return new Response(JSON.stringify({ error: 'API unreachable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  })
}
