import fs from 'fs'
import { canonicalizePath } from '../packages/lesswrong/lib/generated/routeManifest'

type LogEntry = {
  time_local?: string
  method?: string
  url?: string
  protocol?: string
  http_referer?: string
  http_user_agent?: string
}

// Hardcoded exclusions by canonical route path. Populate as needed.
// Examples: '/graphiql', '/robots.txt', '/api/health'
const EXCLUDED_ROUTES: string[] = ['/graphql', '/analyticsEvent', '/robots.txt', '/api/health', '/ckeditor-token']

// Optional: exclude by canonical route prefix. E.g., '/api/cron'
const EXCLUDED_ROUTE_PREFIXES: string[] = ['/feed.xml']

type ReplayOptions = {
  host: string
  userAgent: string
  speed: number
  methods: Set<string>
  include?: string
  exclude?: string
  includeRe?: RegExp
  excludeRe?: RegExp
  filterRoutes: boolean
  dryRun: boolean
  timeoutMs: number
  limit?: number
}

type Stats = {
  totalConsidered: number
  totalFiltered: number
  totalSent: number
  ok2xx: number
  redirects3xx: number
  client4xx: number
  server5xx: number
  otherStatus: number
  networkErrors: number
  timeouts: number
  statusCounts: Record<string, number>
  failures: Array<{ url: string; method: string; status?: number; statusText?: string; error?: string }>
  groupCounts: Record<string, number>
  groupDurations: Record<string, number[]>
}

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {}
  const rest: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=')
      if (v !== undefined) args[k] = v
      else {
        const next = argv[i + 1]
        if (next && !next.startsWith('-')) { args[k] = next; i++ } else args[k] = true
      }
    } else if (a.startsWith('-')) {
      const k = a.slice(1)
      const next = argv[i + 1]
      if (next && !next.startsWith('-')) { args[k] = next; i++ } else args[k] = true
    } else rest.push(a)
  }
  return { args, rest }
}

function parseTimeLocal(s?: string): number | null {
  if (!s) return null
  // Example: 21/Aug/2025:18:58:03 +0000 -> 21 Aug 2025 18:58:03 +0000
  const m = s.match(/^(\d{2})\/(\w{3})\/(\d{4}):(\d{2}:\d{2}:\d{2})\s+([+\-]\d{4})$/)
  if (!m) return null
  const dateStr = `${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]}`
  const t = Date.parse(dateStr)
  return Number.isNaN(t) ? null : t
}

function loadLogs(path: string): LogEntry[] {
  const raw = fs.readFileSync(path, 'utf8')
  const data = JSON.parse(raw)
  if (!Array.isArray(data)) throw new Error('Logs JSON must be an array')
  return data
}

function buildFilters(opts: ReplayOptions) {
  const include = opts.include
  const exclude = opts.exclude
  const includeRe = opts.includeRe
  const excludeRe = opts.excludeRe
  return (e: LogEntry): boolean => {
    const method = (e.method || '').toUpperCase()
    if (!opts.methods.has(method)) return false
    const url = e.url || '/'
    const canon = canonicalizePath(url)
    if (opts.filterRoutes) {
      if (!canon) return false
    }
    if (canon) {
      if (EXCLUDED_ROUTES.includes(canon)) return false
      if (EXCLUDED_ROUTE_PREFIXES.some(p => canon === p || canon.startsWith(p.endsWith('/') ? p : p + '/'))) return false
    }
    if (include && !url.includes(include)) return false
    if (exclude && url.includes(exclude)) return false
    if (includeRe && !includeRe.test(url)) return false
    if (excludeRe && excludeRe.test(url)) return false
    return true
  }
}

function toOptions(args: Record<string, string | boolean>): ReplayOptions {
  const speed = Number(args.speed ?? 1)
  const host = String(args.host ?? '')
  const userAgent = String(args['user-agent'] ?? args.ua ?? 'LessWrong-Replay/1.0')
  const methodsCsv = String(args.methods ?? 'GET')
  const methods = new Set(methodsCsv.split(',').map(s => s.trim().toUpperCase()).filter(Boolean))
  const include = typeof args.include === 'string' ? String(args.include) : undefined
  const exclude = typeof args.exclude === 'string' ? String(args.exclude) : undefined
  const includeRe = typeof args.includeRe === 'string' ? new RegExp(String(args.includeRe)) : undefined
  const excludeRe = typeof args.excludeRe === 'string' ? new RegExp(String(args.excludeRe)) : undefined
  const filterRoutes = args['filter-routes'] === false ? false : true
  const dryRun = !!args['dry-run']
  const timeoutMs = Number(args.timeoutMs ?? 30000)
  const limit = typeof args.limit === 'string' ? Math.max(0, Math.floor(Number(args.limit))) : undefined
  return { host, userAgent, speed, methods, include, exclude, includeRe, excludeRe, filterRoutes, dryRun, timeoutMs, limit }
}

function initStats(): Stats {
  return { totalConsidered: 0, totalFiltered: 0, totalSent: 0, ok2xx: 0, redirects3xx: 0, client4xx: 0, server5xx: 0, otherStatus: 0, networkErrors: 0, timeouts: 0, statusCounts: {}, failures: [], groupCounts: {}, groupDurations: {} }
}

async function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, Math.max(0, ms))) }

async function doRequest(entry: LogEntry, opts: ReplayOptions): Promise<{ ok: boolean; status?: number; statusText?: string; durationMs: number } | { error: string; timeout?: boolean; durationMs: number } > {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs)
  try {
    const start = Date.now()
    const u = new URL(entry.url || '/', opts.host)
    const res = await fetch(u.toString(), {
      method: (entry.method || 'GET').toUpperCase(),
      headers: {
        'User-Agent': opts.userAgent,
        'Accept': 'text/html,application/json;q=0.9,*/*;q=0.8',
        'Referer': entry.http_referer || '',
        'cookie': `_vercel_jwt=${process.env.VERCEL_JWT}; _vercel_session=${process.env.VERCEL_SESSION}; loginToken=${process.env.LOGIN_TOKEN}`,
        'lwgraphql': 'allow',
      },
      redirect: 'manual',
      signal: controller.signal
    })
    clearTimeout(timeout)
    // Wait for all the streamed content to finish coming back
    await res.text();
    const durationMs = Date.now() - start
    const durationMsWithSpacePadding = `${durationMs}ms`.padStart(7, ' ')
    
    // eslint-disable-next-line no-console
    console.log(`${new Date().toISOString()} (${durationMsWithSpacePadding}): Finished request to ${u.toString()}`);
    return { ok: res.ok, status: res.status, statusText: res.statusText, durationMs }
  } catch (e: any) {
    clearTimeout(timeout)
    const msg = e && e.message ? String(e.message) : 'unknown-error'
    const timeoutErr = /AbortError/i.test(msg)
    return { error: msg, timeout: timeoutErr, durationMs: 0 }
  }
}

function getRouteGroup(url: string): string {
  const canon = canonicalizePath(url)
  const path = canon || new URL(url, 'http://example.com').pathname
  if (path === '/' || path === '') return '/'
  const seg = path.startsWith('/') ? path.slice(1) : path
  const first = seg.split('/')[0]
  return first || '/'
}

function getFilteredLogsToLimit(logs: LogEntry[], opts: ReplayOptions, stats: Stats) {
  const filter = buildFilters(opts);
  let consideredIdx = 0;
  if (!opts.limit) {
    const filteredLogs = logs.filter(filter);
    stats.totalConsidered = logs.length;
    stats.totalFiltered = logs.length - filteredLogs.length;
    return filteredLogs;
  }

  const filteredLogs: LogEntry[] = [];

  while (consideredIdx < logs.length && filteredLogs.length < opts.limit) {
    const e = logs[consideredIdx];
    if (filter(e)) {
      filteredLogs.push(e);
    }
    consideredIdx++;
  }

  stats.totalConsidered = consideredIdx + 1;
  stats.totalFiltered = (consideredIdx - filteredLogs.length) + 1;
  return filteredLogs;
}

const pendingRequests: Promise<void>[] = [];

async function replay(logs: LogEntry[], opts: ReplayOptions, countOnly: boolean, dryRunOverride?: boolean) {
  const dryRun = dryRunOverride ?? opts.dryRun
  const stats = initStats()

  const filteredLogs = getFilteredLogsToLimit(logs, opts, stats)

  // Schedule requests according to original cadence (scaled by speed), without serial awaiting
  const startNow = Date.now()
  let prevTime: number | null = null
  let offsetMs = 0
  pendingRequests.length = 0

  for (const e of filteredLogs.slice(0, opts.limit)) {
    // Count by route group for all filtered requests (planned or executed)
    try {
      const grp = getRouteGroup(e.url || '/')
      stats.groupCounts[grp] = (stats.groupCounts[grp] || 0) + 1
    } catch {}

    const t = parseTimeLocal(e.time_local)
    let interDelayMs = 0
    if (prevTime != null && t != null) {
      const delta = t - prevTime
      interDelayMs = Math.max(0, Math.floor(delta / Math.max(0.000001, opts.speed)))
      offsetMs += interDelayMs
    }
    if (t != null) prevTime = t

    if (countOnly) continue

    if (dryRun) {
      const line = JSON.stringify({ delayMs: interDelayMs, atMsFromStart: offsetMs, method: e.method || 'GET', url: e.url || '/', userAgent: opts.userAgent })
      // eslint-disable-next-line no-console
      console.log(line)
      continue
    }

    const scheduleAt = startNow + offsetMs
    const delay = Math.max(0, scheduleAt - Date.now())
    const p = (async () => {
      if (delay > 0) await sleep(delay)
      stats.totalSent++
      const result = await doRequest(e, opts)
      const grp = getRouteGroup(e.url || '/')
      if ('error' in result) {
        stats.networkErrors++
        if (result.timeout) stats.timeouts++
        stats.failures.push({ url: e.url || '/', method: e.method || 'GET', error: result.error })
        stats.groupDurations[grp] = stats.groupDurations[grp] || []
        stats.groupDurations[grp].push(result.durationMs)
        return
      }
      const status = result.status || 0
      stats.statusCounts[String(status)] = (stats.statusCounts[String(status)] || 0) + 1
      if (status >= 200 && status < 300) stats.ok2xx++
      else if (status >= 300 && status < 400) stats.redirects3xx++
      else if (status >= 400 && status < 500) { stats.client4xx++; stats.failures.push({ url: e.url || '/', method: e.method || 'GET', status, statusText: result.statusText }) }
      else if (status >= 500 && status < 600) { stats.server5xx++; stats.failures.push({ url: e.url || '/', method: e.method || 'GET', status, statusText: result.statusText }) }
      else stats.otherStatus++
      stats.groupDurations[grp] = stats.groupDurations[grp] || []
      stats.groupDurations[grp].push(result.durationMs)
    })()
    pendingRequests.push(p)
  }

  if (!countOnly && !dryRun) {
    await Promise.all(pendingRequests)
  }
  return stats
}

async function main() {
  const [cmd, ...restArgs] = process.argv.slice(2)
  const { args } = parseArgs(restArgs)
  const logsPath = String(args.logs ?? '../nginxlogs.json')
  const logs = loadLogs(logsPath)
  const opts = toOptions(args)

  if (cmd === 'count') {
    const stats = await replay(logs, opts, true)
    // eslint-disable-next-line no-console
    console.log(String(stats.totalConsidered - stats.totalFiltered))
    return
  }

  if (cmd !== 'replay' && cmd !== undefined) {
    // eslint-disable-next-line no-console
    console.error('Unknown command. Use: replay | count')
    process.exitCode = 2
    return
  }

  if (!opts.host && !opts.dryRun) {
    // eslint-disable-next-line no-console
    console.error('Missing --host for replay. Example: --host https://new.lesswrong.com')
    process.exitCode = 2
    return
  }

  const stats = await replay(logs, opts, false)
  function percentile(sorted: number[], p: number): number {
    if (!sorted.length) return 0
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
    return sorted[idx]
  }

  const groupStats = Object.fromEntries(
    Object.entries(stats.groupCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([group, count]) => {
        const arr = (stats.groupDurations[group] || []).slice().sort((a, b) => a - b)
        const mean = arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0
        return [group, {
          count,
          meanMs: mean,
          p50Ms: percentile(arr, 50),
          p90Ms: percentile(arr, 90),
          p99Ms: percentile(arr, 99)
        }]
      })
  )

  const summary = {
    totalConsidered: stats.totalConsidered,
    totalFilteredOut: stats.totalFiltered,
    totalSent: stats.totalSent,
    ok2xx: stats.ok2xx,
    redirects3xx: stats.redirects3xx,
    client4xx: stats.client4xx,
    server5xx: stats.server5xx,
    otherStatus: stats.otherStatus,
    networkErrors: stats.networkErrors,
    timeouts: stats.timeouts,
    topStatuses: Object.fromEntries(Object.entries(stats.statusCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)),
    groups: groupStats
  }
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ summary, failures: stats.failures }, null, 2))
}

main().catch(err => { console.error(err); process.exitCode = 1 })


