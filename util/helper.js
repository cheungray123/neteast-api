/**
 * 辅助工具函数
 */

/**
 * Cookie 字符串转对象
 */
export function cookieToJson(cookie) {
  if (!cookie) return {}
  
  const cookieArr = cookie.split(';')
  const obj = {}
  
  for (let i = 0; i < cookieArr.length; i++) {
    const item = cookieArr[i]
    const eqIndex = item.indexOf('=')
    if (eqIndex > 0 && eqIndex < item.length - 1) {
      const key = item.substring(0, eqIndex).trim()
      const value = item.substring(eqIndex + 1).trim()
      obj[key] = value
    }
  }
  
  return obj
}

/**
 * Cookie 对象转字符串
 */
export function cookieObjToString(cookie) {
  const keys = Object.keys(cookie)
  const result = []
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    result[i] = `${encodeURIComponent(key)}=${encodeURIComponent(cookie[key])}`
  }
  
  return result.join('; ')
}

/**
 * 布尔值转换
 */
export function toBoolean(val) {
  if (typeof val === 'boolean') return val
  if (val === '') return val
  return val === 'true' || val == '1'
}

/**
 * 中国 IP 段数据
 */
const CHINESE_IP_PREFIXES = [
  '116.25', '116.28', '116.52', '116.76', '116.77',
  '117.136', '117.150', '117.172', '117.181',
  '119.4', '119.5', '119.6', '119.8',
  '120.192', '120.204', '120.209',
  '121.58', '121.59', '121.76',
  '122.88', '122.96', '122.194',
  '123.138', '123.150', '123.179',
  '124.72', '124.114', '124.232',
  '125.70', '125.74', '125.80',
  '182.32', '182.34', '182.84',
  '183.192', '183.232', '183.236',
  '220.181', '220.182', '220.192',
  '221.130', '221.176', '221.228',
  '222.33', '222.76', '222.209'
]

/**
 * 生成随机中国 IP
 */
export function generateRandomChineseIP() {
  const prefix = CHINESE_IP_PREFIXES[Math.floor(Math.random() * CHINESE_IP_PREFIXES.length)]
  const parts = prefix.split('.')
  
  // 补充剩余部分
  while (parts.length < 4) {
    parts.push(String(Math.floor(Math.random() * 256)))
  }
  
  return parts.join('.')
}

/**
 * 解码 URI 组件（安全版本）
 */
export function safeDecodeURIComponent(str) {
  try {
    return decodeURIComponent(str)
  } catch (e) {
    return str
  }
}

/**
 * 防抖函数
 */
export function debounce(fn, delay) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

/**
 * 节流函数
 */
export function throttle(fn, interval) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      return fn.apply(this, args)
    }
  }
}

/**
 * 深拷贝
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(item => deepClone(item))
  
  const cloned = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

/**
 * 判断是否为空对象
 */
export function isEmpty(obj) {
  if (!obj) return true
  if (Array.isArray(obj)) return obj.length === 0
  return Object.keys(obj).length === 0
}

/**
 * 生成唯一 ID
 */
export function generateUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 格式化时间
 */
export function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * 解析歌词
 */
export function parseLyric(lyric) {
  if (!lyric) return []
  
  const lines = lyric.split('\n')
  const result = []
  const timeRegex = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g
  
  for (const line of lines) {
    const times = []
    let match
    
    while ((match = timeRegex.exec(line)) !== null) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0')) : 0
      times.push(minutes * 60 * 1000 + seconds * 1000 + milliseconds)
    }
    
    // 移除时间标签
    const text = line.replace(timeRegex, '').trim()
    
    if (text && times.length > 0) {
      for (const time of times) {
        result.push({ time, text })
      }
    }
  }
  
  return result.sort((a, b) => a.time - b.time)
}

/**
 * 安全的 JSON 解析
 */
export function safeJSONParse(str, defaultValue = null) {
  try {
    return JSON.parse(str)
  } catch (e) {
    return defaultValue
  }
}

/**
 * 对象转查询字符串
 */
export function objectToQueryString(obj) {
  return Object.entries(obj)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}

/**
 * 查询字符串转对象
 */
export function queryStringToObject(qs) {
  const result = {}
  if (!qs) return result
  
  const searchParams = new URLSearchParams(qs)
  for (const [key, value] of searchParams) {
    result[key] = value
  }
  
  return result
}

/**
 * 延迟函数
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 重试函数
 */
export async function retry(fn, options = {}) {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options
  
  let lastError
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < maxRetries - 1) {
        await sleep(delay * Math.pow(backoff, i))
      }
    }
  }
  
  throw lastError
}