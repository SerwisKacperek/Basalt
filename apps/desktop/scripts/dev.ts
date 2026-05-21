import { spawn, type ChildProcess } from 'child_process'
import { resolve } from 'path'

const WEB_URL = 'http://localhost:5174'
const root = resolve(__dirname, '..')

const children: ChildProcess[] = []
const shutdown = (code = 0) => {
  for (const c of children) c.kill('SIGTERM')
  process.exit(code)
}
process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

function run(cmd: string, args: string[], opts: { cwd?: string; env?: NodeJS.ProcessEnv } = {}) {
  const child = spawn(cmd, args, {
    cwd: opts.cwd ?? root,
    env: { ...process.env, ...opts.env },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) shutdown(code)
  })
  children.push(child)
  return child
}

async function waitForUrl(url: string, timeoutMs = 30_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status < 500) return
    } catch {}
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

async function main() {
  run('bun', ['--filter', 'web', 'dev:electron'])
  run('bunx', ['tsc', '--watch', '--preserveWatchOutput'])

  await waitForUrl(WEB_URL)

  run('bunx', ['electron', '.'], {
    env: { DEV: 'true', VITE_DEV_SERVER_URL: WEB_URL },
  })
}

main().catch((err) => {
  console.error(err)
  shutdown(1)
})
