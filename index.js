/**
 * Cloudflare Workers Entry Point
 * 网易云音乐 API - CF Workers 版本
 * 优化版本：支持 Cache API、性能监控、请求限流
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handleRequest, getAvailableModules } from './request.js'

// 创建 Hono 应用
const app = new Hono()

// 性能指标收集
const metrics = {
  requests: 0,
  errors: 0,
  totalTime: 0,
  startTime: Date.now()
}

// 请求限流配置
const RATE_LIMIT = {
  windowMs: 60000,        // 时间窗口 1 分钟
  maxRequests: 100,       // 每个 IP 最大请求数
  enabled: true           // 是否启用
}

// 简单的内存限流器
const rateLimitStore = new Map()

/**
 * 清理过期的限流记录
 */
function cleanupRateLimit() {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.startTime > RATE_LIMIT.windowMs) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * 检查请求限流
 */
function checkRateLimit(ip) {
  if (!RATE_LIMIT.enabled) return { allowed: true }
  
  const now = Date.now()
  const record = rateLimitStore.get(ip)
  
  if (!record || now - record.startTime > RATE_LIMIT.windowMs) {
    rateLimitStore.set(ip, { count: 1, startTime: now })
    return { allowed: true }
  }
  
  if (record.count >= RATE_LIMIT.maxRequests) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((RATE_LIMIT.windowMs - (now - record.startTime)) / 1000)
    }
  }
  
  record.count++
  return { allowed: true }
}

// 定期清理限流记录（每次请求时检查）
let lastCleanup = Date.now()

// CORS 中间件 - 从环境变量读取允许的域名
app.use('*', async (c, next) => {
  const allowedOrigins = c.env.ALLOWED_ORIGINS 
    ? c.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
    : null
  
  const corsOptions = {
    origin: allowedOrigins || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Cookie', 'X-Requested-With'],
    credentials: true,
  }
  
  return cors(corsOptions)(c, next)
})

// 请求限流中间件
app.use('*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || 
             c.req.header('X-Real-IP') || 
             'unknown'
  
  // 清理过期记录
  if (Date.now() - lastCleanup > 300000) { // 5 分钟清理一次
    cleanupRateLimit()
    lastCleanup = Date.now()
  }
  
  const rateCheck = checkRateLimit(ip)
  if (!rateCheck.allowed) {
    return c.json({
      code: 429,
      data: null,
      msg: `请求过于频繁，请 ${rateCheck.retryAfter} 秒后重试`
    }, 429, {
      'Retry-After': String(rateCheck.retryAfter),
      'X-RateLimit-Limit': String(RATE_LIMIT.maxRequests),
      'X-RateLimit-Remaining': '0'
    })
  }
  
  await next()
})

// Cookie 解析中间件
app.use('*', async (c, next) => {
  const cookieHeader = c.req.header('Cookie') || ''
  const cookies = {}
  
  cookieHeader.split(/;\s+/).forEach(pair => {
    const eqIndex = pair.indexOf('=')
    if (eqIndex > 0) {
      const key = decodeURIComponent(pair.slice(0, eqIndex).trim())
      const value = decodeURIComponent(pair.slice(eqIndex + 1).trim())
      cookies[key] = value
    }
  })
  
  c.set('cookies', cookies)
  await next()
})

// 健康检查
app.get('/', (c) => {
  const uptime = Math.floor((Date.now() - metrics.startTime) / 1000)
  const avgTime = metrics.requests > 0 
    ? Math.round(metrics.totalTime / metrics.requests) 
    : 0
  
  return c.json({
    code: 200,
    msg: 'NeteaseCloudMusicAPI Enhanced - Cloudflare Workers',
    version: '4.30.3',
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
    metrics: {
      requests: metrics.requests,
      errors: metrics.errors,
      avgResponseTime: `${avgTime}ms`
    },
    modules: getAvailableModules().length
  })
})

// 健康检查端点
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

// 指标端点（可选密码保护）
app.get('/metrics', (c) => {
  const metricsPassword = c.env.METRICS_PASSWORD
  if (metricsPassword) {
    const auth = c.req.query('password') || c.req.header('X-Metrics-Password')
    if (auth !== metricsPassword) {
      return c.json({ code: 401, msg: 'Unauthorized' }, 401)
    }
  }
  
  const uptime = Math.floor((Date.now() - metrics.startTime) / 1000)
  const avgTime = metrics.requests > 0 
    ? Math.round(metrics.totalTime / metrics.requests) 
    : 0
  
  return c.json({
    uptime_seconds: uptime,
    requests_total: metrics.requests,
    errors_total: metrics.errors,
    avg_response_time_ms: avgTime,
    memory_cache_size: rateLimitStore.size,
    rate_limit: RATE_LIMIT
  })
})

// 模块列表端点
app.get('/modules', (c) => {
  return c.json({
    code: 200,
    data: getAvailableModules()
  })
})

// API 路由 - 动态匹配
app.all('/:path*', async (c) => {
  const startTime = Date.now()
  const path = c.req.path
  const method = c.req.method
  
  // 解析请求参数
  let query = {}
  let body = {}
  
  // GET 参数
  const url = new URL(c.req.url)
  url.searchParams.forEach((value, key) => {
    query[key] = value
  })
  
  // POST/PUT body
  if (method === 'POST' || method === 'PUT') {
    try {
      const contentType = c.req.header('Content-Type') || ''
      if (contentType.includes('application/json')) {
        body = await c.req.json()
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await c.req.parseBody()
        body = { ...formData }
      }
    } catch (e) {
      // 忽略解析错误
    }
  }
  
  // 合并参数
  const cookies = c.get('cookies') || {}
  
  // 如果请求中没有 MUSIC_U，使用环境变量中的 token
  if (!cookies.MUSIC_U && c.env.MUSIC_U) {
    cookies.MUSIC_U = c.env.MUSIC_U
  }
  
  const params = {
    ...query,
    ...body,
    cookie: cookies
  }
  
  // 提取客户端 IP
  let ip = c.req.header('CF-Connecting-IP') || 
           c.req.header('X-Real-IP') || 
           c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() || 
           '127.0.0.1'
  
  params.ip = ip
  
  try {
    // 处理请求
    const result = await handleRequest(path, params, c.env)
    
    // 设置响应 cookie
    if (result.cookie && result.cookie.length > 0) {
      result.cookie.forEach(cookie => {
        c.header('Set-Cookie', cookie, { append: true })
      })
    }
    
    // 处理重定向
    if (result.redirectUrl) {
      return c.redirect(result.redirectUrl, result.status || 302)
    }
    
    // 更新指标
    metrics.requests++
    metrics.totalTime += Date.now() - startTime
    
    // 添加性能头
    c.header('X-Response-Time', `${Date.now() - startTime}ms`)
    c.header('X-Cache-Status', result.cached ? 'HIT' : 'MISS')
    
    return c.json(result.body, result.status || 200)
  } catch (error) {
    metrics.requests++
    metrics.errors++
    metrics.totalTime += Date.now() - startTime
    
    console.error('Request error:', error)
    
    // 处理错误响应
    if (error.status && error.body) {
      c.header('X-Response-Time', `${Date.now() - startTime}ms`)
      return c.json(error.body, error.status)
    }
    
    return c.json({
      code: 500,
      data: null,
      msg: error.message || 'Internal Server Error'
    }, 500)
  }
})

// 404 处理
app.notFound((c) => {
  return c.json({
    code: 404,
    data: null,
    msg: 'Not Found',
    hint: '访问 /modules 查看可用接口列表'
  }, 404)
})

// 错误处理
app.onError((err, c) => {
  metrics.errors++
  console.error('Global error:', err)
  
  return c.json({
    code: 500,
    data: null,
    msg: err.message || 'Internal Server Error'
  }, 500)
})

// 导出 Workers 处理函数
export default {
  async fetch(request, env, ctx) {
    // 使用 ctx.waitUntil 处理后台任务
    // 例如：清理过期数据、记录日志等
    
    return app.fetch(request, env, ctx)
  },
  
  // 支持定时任务（Cron Triggers）
  async scheduled(event, env, ctx) {
    // 定期清理缓存和限流记录
    ctx.waitUntil(
      new Promise((resolve) => {
        // 清理限流记录
        const now = Date.now()
        for (const [key, value] of rateLimitStore.entries()) {
          if (now - value.startTime > RATE_LIMIT.windowMs) {
            rateLimitStore.delete(key)
          }
        }
        resolve()
      })
    )
    
    return new Response('OK')
  }
}