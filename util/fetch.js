/**
 * Fetch 请求模块
 * 适配 CF Workers 环境，支持缓存、超时、重试
 */

import { encrypt } from './crypto.js'
import { cookieObjToString, cookieToJson, generateRandomChineseIP } from './helper.js'

// 配置
const APP_CONF = {
  domain: 'https://music.163.com',
  apiDomain: 'https://interface.music.163.com',
  encrypt: true,
  encryptResponse: false,
  checkToken: '9ca17ae2e6ffcda170e2e6ee8af14fbabdb988f225b3868eb2c15a879b9a83d274a790ac8ff54a97b889d5d42af0feaec3b92af58cff99c470a7eafd88f75e839a9ea7c14e909da883e83fb692a3abdb6b92adee9e'
}

// 请求配置
const REQUEST_CONFIG = {
  timeout: 10000,           // 默认超时 10s
  maxRetries: 2,            // 最大重试次数
  retryDelay: 500,          // 重试延迟 ms
  cacheEnabled: true,       // 启用缓存
  cacheTTL: 60000           // 缓存 TTL 60s
}

// 可缓存的接口（GET 类请求）
const CACHEABLE_PATHS = new Set([
  '/api/search/get',
  '/api/v3/song/detail',
  '/api/song/lyric',
  '/api/v6/playlist/detail',
  '/api/artist/head/info/get',
  '/api/toplist',
  '/api/top/song',
  '/api/playlist/hot',
  '/api/playlist/catlist',
  '/api/search/hot',
  '/api/search/suggest/web',
  '/api/banner'
])

// User-Agent 映射
const userAgentMap = {
  weapi: {
    pc: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  },
  linuxapi: {
    linux: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  },
  api: {
    pc: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36 Chrome/131.0.0.0 NeteaseMusicDesktop/3.0.18.203152',
    android: 'NeteaseMusic/9.1.65.240927161425(9001065);Dalvik/2.1.0 (Linux; U; Android 14; 23013RK75C Build/UKQ1.230804.001)',
    iphone: 'NeteaseMusic 9.0.90/5038 (iPhone; iOS 16.2; zh_CN)'
  }
}

// 通用浏览器请求头
const commonBrowserHeaders = {
  'Accept': '*/*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Connection': 'keep-alive'
}

// OS 映射
const osMap = {
  pc: {
    os: 'pc',
    appver: '3.1.17.204416',
    osver: 'Microsoft-Windows-10-Professional-build-19045-64bit',
    channel: 'netease'
  },
  android: {
    os: 'android',
    appver: '8.20.20.231215173437',
    osver: '14',
    channel: 'xiaomi'
  },
  iphone: {
    os: 'iPhone OS',
    appver: '9.0.90',
    osver: '16.2',
    channel: 'distribution'
  }
}

// 特殊状态码
const SPECIAL_STATUS_CODES = new Set([201, 302, 400, 502, 800, 801, 802, 803])

// 内存缓存（Worker 实例级别）
const memoryCache = new Map()

/**
 * 选择 User-Agent
 */
function chooseUserAgent(crypto, uaType = 'pc') {
  return (userAgentMap[crypto] && userAgentMap[crypto][uaType]) || ''
}

/**
 * 生成请求 ID
 */
function generateRequestId() {
  return `${Date.now()}_${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`
}

/**
 * 生成缓存键
 */
function generateCacheKey(uri, data, cookie) {
  const dataStr = JSON.stringify(data)
  const cookieKey = cookie.MUSIC_U || cookie.MUSIC_A || ''
  // 简单哈希
  let hash = 0
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `${uri}:${hash}:${cookieKey ? 'auth' : 'anon'}`
}

/**
 * 从内存缓存获取
 */
function getFromMemoryCache(key) {
  const cached = memoryCache.get(key)
  if (cached && cached.expiry > Date.now()) {
    return cached.data
  }
  memoryCache.delete(key)
  return null
}

/**
 * 设置内存缓存
 */
function setToMemoryCache(key, data, ttl = REQUEST_CONFIG.cacheTTL) {
  // 限制缓存大小
  if (memoryCache.size > 500) {
    const oldestKey = memoryCache.keys().next().value
    memoryCache.delete(oldestKey)
  }
  memoryCache.set(key, {
    data,
    expiry: Date.now() + ttl
  })
}

/**
 * 带超时的 fetch
 */
async function fetchWithTimeout(url, options, timeout = REQUEST_CONFIG.timeout) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 处理 Cookie 对象
 */
async function processCookieObject(cookie, uri, kvStore) {
  const os = osMap[cookie.os] || osMap['pc']
  
  // 从 KV 获取或生成匿名 token
  let anonymousToken = ''
  if (kvStore) {
    anonymousToken = await kvStore.get('anonymous_token') || ''
  }
  
  const processedCookie = {
    ...cookie,
    __remember_me: 'true',
    ntes_kaola_ad: '1',
    WNMCID: cookie.WNMCID || generateWNMCID(),
    WEVNSM: cookie.WEVNSM || '1.0.0',
    osver: cookie.osver || os.osver,
    deviceId: cookie.deviceId || generateDeviceId(),
    os: cookie.os || os.os,
    channel: cookie.channel || os.channel,
    appver: cookie.appver || os.appver
  }
  
  if (!processedCookie.MUSIC_U) {
    processedCookie.MUSIC_A = processedCookie.MUSIC_A || anonymousToken
  }
  
  return processedCookie
}

/**
 * 生成 WNMCID
 */
function generateWNMCID() {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  let randomString = ''
  for (let i = 0; i < 6; i++) {
    randomString += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${randomString}.${Date.now()}.01.0`
}

/**
 * 生成设备 ID
 */
function generateDeviceId() {
  const hexChars = '0123456789ABCDEF'
  const chars = []
  for (let i = 0; i < 52; i++) {
    chars.push(hexChars[Math.floor(Math.random() * 16)])
  }
  return chars.join('')
}

/**
 * 核心请求函数（带重试）
 */
async function makeRequest(url, headers, body, retries = REQUEST_CONFIG.maxRetries) {
  let lastError
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...headers
        },
        body
      })
      return response
    } catch (error) {
      lastError = error
      // 不重试超时错误
      if (error.message.includes('timeout')) {
        throw error
      }
      // 最后一次尝试不再等待
      if (attempt < retries) {
        await delay(REQUEST_CONFIG.retryDelay * (attempt + 1))
      }
    }
  }
  
  throw lastError
}

/**
 * 创建请求函数
 */
export function createFetchRequest(kvStore, env) {
  return async function request(uri, data, options = {}) {
    // 初始化变量
    const headers = options.headers ? { ...options.headers } : {}
    
    // IP 头设置
    const ip = options.realIP || options.ip || (options.randomCNIP ? generateRandomChineseIP() : '')
    if (ip) {
      headers['X-Real-IP'] = ip
      headers['X-Forwarded-For'] = ip
    }
    
    // Cookie 处理
    let cookie = options.cookie || {}
    if (typeof cookie === 'string') {
      cookie = cookieToJson(cookie)
    }
    
    cookie = await processCookieObject(cookie, uri, kvStore)
    headers['Cookie'] = cookieObjToString(cookie)
    
    let url = ''
    let encryptData = {}
    let crypto = options.crypto || (APP_CONF.encrypt ? 'eapi' : 'api')
    const csrfToken = cookie['__csrf'] || ''
    
    // 添加通用浏览器请求头
    Object.assign(headers, commonBrowserHeaders)
    
    // 根据加密方式处理
    switch (crypto) {
      case 'weapi':
        headers['Referer'] = options.domain || APP_CONF.domain
        headers['Origin'] = options.domain || APP_CONF.domain
        headers['User-Agent'] = options.ua || chooseUserAgent('weapi')
        headers['Sec-Ch-Ua'] = '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"'
        headers['Sec-Ch-Ua-Mobile'] = '?0'
        headers['Sec-Ch-Ua-Platform'] = '"Windows"'
        data.csrf_token = csrfToken
        encryptData = encrypt.weapi(data)
        url = (options.domain || APP_CONF.domain) + '/weapi/' + uri.substr(5)
        break
        
      case 'linuxapi':
        headers['User-Agent'] = options.ua || chooseUserAgent('linuxapi', 'linux')
        encryptData = encrypt.linuxapi({
          method: 'POST',
          url: (options.domain || APP_CONF.domain) + uri,
          params: data
        })
        url = (options.domain || APP_CONF.domain) + '/api/linux/forward'
        break
        
      case 'eapi':
      case 'api':
        const header = {
          osver: cookie.osver,
          deviceId: cookie.deviceId,
          os: cookie.os,
          appver: cookie.appver,
          versioncode: cookie.versioncode || '140',
          mobilename: cookie.mobilename || '',
          buildver: String(Math.floor(Date.now() / 1000)),
          resolution: cookie.resolution || '1920x1080',
          __csrf: csrfToken,
          channel: cookie.channel,
          requestId: generateRequestId(),
          ...(options.checkToken ? { 'X-antiCheatToken': APP_CONF.checkToken } : {})
        }
        
        if (cookie.MUSIC_U) header['MUSIC_U'] = cookie.MUSIC_U
        if (cookie.MUSIC_A) header['MUSIC_A'] = cookie.MUSIC_A
        
        headers['User-Agent'] = options.ua || chooseUserAgent('api', 'iphone')
        headers['Referer'] = APP_CONF.domain + '/'
        headers['Origin'] = APP_CONF.domain
        
        if (crypto === 'eapi') {
          data.header = header
          data.e_r = options.e_r !== undefined ? options.e_r : APP_CONF.encryptResponse
          encryptData = encrypt.eapi(uri, data)
          url = (options.domain || APP_CONF.apiDomain) + '/eapi/' + uri.substr(5)
        } else {
          url = (options.domain || APP_CONF.apiDomain) + uri
          encryptData = data
        }
        break
        
      default:
        console.error('Unknown Crypto:', crypto)
    }
    
    // 检查缓存（仅对可缓存接口）
    const shouldCache = REQUEST_CONFIG.cacheEnabled && 
                        CACHEABLE_PATHS.has(uri) && 
                        !options.noCache
    
    if (shouldCache) {
      const cacheKey = generateCacheKey(uri, data, cookie)
      const cachedResult = getFromMemoryCache(cacheKey)
      if (cachedResult) {
        return {
          ...cachedResult,
          cached: true
        }
      }
    }
    
    // 构建请求体
    const body = new URLSearchParams(encryptData).toString()
    
    // 发送请求（带重试）
    const response = await makeRequest(url, headers, body)
    
    // 解析响应
    const answer = {
      status: 500,
      body: {},
      cookie: []
    }
    
    // 提取 set-cookie
    const setCookie = response.headers.get('set-cookie')
    if (setCookie) {
      answer.cookie = setCookie.split(',').map(c => 
        c.replace(/\s*Domain=[^(;|$)]+;*/, '')
      )
    }
    
    // 解析响应体
    let responseText = await response.text()
    
    try {
      if (crypto === 'eapi' && data.e_r) {
        // 解密 eapi 响应
        const hexData = Array.from(new TextEncoder().encode(responseText))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase()
        answer.body = encrypt.eapiResDecrypt(hexData)
      } else {
        answer.body = JSON.parse(responseText)
      }
      
      if (answer.body.code) {
        answer.body.code = Number(answer.body.code)
      }
      
      answer.status = Number(answer.body.code || response.status)
      
      if (SPECIAL_STATUS_CODES.has(answer.body.code)) {
        answer.status = 200
      }
    } catch (e) {
      answer.body = responseText
      answer.status = response.status
    }
    
    answer.status = answer.status > 100 && answer.status < 600 ? answer.status : 400
    
    // 缓存成功响应
    if (shouldCache && answer.status === 200) {
      const cacheKey = generateCacheKey(uri, data, cookie)
      setToMemoryCache(cacheKey, answer)
    }
    
    if (answer.status === 200) {
      return answer
    } else {
      throw answer
    }
  }
}

// 导出配置以便外部修改
export { REQUEST_CONFIG, CACHEABLE_PATHS }