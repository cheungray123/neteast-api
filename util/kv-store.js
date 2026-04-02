/**
 * KV 存储模块
 * 支持内存缓存层、批量操作
 */

// 默认 TTL（毫秒）
const DEFAULT_TTL = {
  ANONYMOUS_TOKEN: 7 * 24 * 60 * 60 * 1000,  // 7 天
  API_CACHE: 2 * 60 * 1000,                   // 2 分钟
  DEVICE_ID: 365 * 24 * 60 * 60 * 1000,       // 365 天
  MEMORY_CACHE: 60 * 1000                     // 内存缓存 1 分钟
}

// 内存缓存层
class MemoryCacheLayer {
  constructor(maxSize = 200) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key) {
    const item = this.cache.get(key)
    if (item && item.expiry > Date.now()) {
      return item.value
    }
    this.cache.delete(key)
    return null
  }

  set(key, value, ttl) {
    // LRU 策略：如果超过最大大小，删除最旧的
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
    
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    })
  }

  delete(key) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  // 清理过期项
  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry <= now) {
        this.cache.delete(key)
      }
    }
  }
}

// 全局内存缓存实例
const memoryCache = new MemoryCacheLayer()

export class KVStore {
  constructor(kvNamespace, options = {}) {
    this.kv = kvNamespace
    this.memoryCache = options.memoryCache !== false ? memoryCache : null
    this.prefix = options.prefix || ''
  }

  /**
   * 生成带前缀的键
   */
  _key(key) {
    return this.prefix ? `${this.prefix}:${key}` : key
  }

  /**
   * 获取值（带内存缓存）
   * @param {string} key 键名
   * @returns {Promise<string|null>}
   */
  async get(key) {
    if (!this.kv) return null
    
    const fullKey = this._key(key)
    
    // 先检查内存缓存
    if (this.memoryCache) {
      const cached = this.memoryCache.get(fullKey)
      if (cached !== null) {
        return cached
      }
    }
    
    try {
      const value = await this.kv.get(fullKey)
      
      // 写入内存缓存
      if (value && this.memoryCache) {
        this.memoryCache.set(fullKey, value, DEFAULT_TTL.MEMORY_CACHE)
      }
      
      return value
    } catch (e) {
      console.error('KV get error:', e)
      return null
    }
  }

  /**
   * 获取 JSON 值（带内存缓存）
   * @param {string} key 键名
   * @returns {Promise<any|null>}
   */
  async getJSON(key) {
    if (!this.kv) return null
    
    const fullKey = this._key(key)
    
    // 先检查内存缓存
    if (this.memoryCache) {
      const cached = this.memoryCache.get(fullKey)
      if (cached !== null) {
        return cached
      }
    }
    
    try {
      const value = await this.kv.get(fullKey, { type: 'json' })
      
      // 写入内存缓存
      if (value && this.memoryCache) {
        this.memoryCache.set(fullKey, value, DEFAULT_TTL.MEMORY_CACHE)
      }
      
      return value
    } catch (e) {
      console.error('KV getJSON error:', e)
      return null
    }
  }

  /**
   * 设置值
   * @param {string} key 键名
   * @param {string} value 值
   * @param {number} ttl 过期时间（毫秒）
   */
  async set(key, value, ttl) {
    if (!this.kv) return false
    
    const fullKey = this._key(key)
    
    try {
      const expirationTtl = ttl ? Math.floor(ttl / 1000) : undefined
      await this.kv.put(fullKey, value, { expirationTtl })
      
      // 更新内存缓存
      if (this.memoryCache) {
        this.memoryCache.set(fullKey, value, ttl || DEFAULT_TTL.MEMORY_CACHE)
      }
      
      return true
    } catch (e) {
      console.error('KV set error:', e)
      return false
    }
  }

  /**
   * 设置 JSON 值
   * @param {string} key 键名
   * @param {any} value 值
   * @param {number} ttl 过期时间（毫秒）
   */
  async setJSON(key, value, ttl) {
    if (!this.kv) return false
    
    const fullKey = this._key(key)
    
    try {
      const expirationTtl = ttl ? Math.floor(ttl / 1000) : undefined
      await this.kv.put(fullKey, JSON.stringify(value), { expirationTtl })
      
      // 更新内存缓存
      if (this.memoryCache) {
        this.memoryCache.set(fullKey, value, ttl || DEFAULT_TTL.MEMORY_CACHE)
      }
      
      return true
    } catch (e) {
      console.error('KV setJSON error:', e)
      return false
    }
  }

  /**
   * 删除值
   * @param {string} key 键名
   */
  async delete(key) {
    if (!this.kv) return false
    
    const fullKey = this._key(key)
    
    try {
      await this.kv.delete(fullKey)
      
      // 清除内存缓存
      if (this.memoryCache) {
        this.memoryCache.delete(fullKey)
      }
      
      return true
    } catch (e) {
      console.error('KV delete error:', e)
      return false
    }
  }

  /**
   * 批量获取
   * @param {string[]} keys 键名数组
   * @returns {Promise<Object<string, any>>}
   */
  async getMultiple(keys) {
    if (!this.kv || !keys.length) return {}
    
    const result = {}
    const uncachedKeys = []
    
    // 先从内存缓存获取
    if (this.memoryCache) {
      for (const key of keys) {
        const fullKey = this._key(key)
        const cached = this.memoryCache.get(fullKey)
        if (cached !== null) {
          result[key] = cached
        } else {
          uncachedKeys.push(key)
        }
      }
    } else {
      uncachedKeys.push(...keys)
    }
    
    // 从 KV 获取未缓存的值
    if (uncachedKeys.length > 0) {
      const promises = uncachedKeys.map(async (key) => {
        const value = await this.get(key)
        return { key, value }
      })
      
      const values = await Promise.all(promises)
      for (const { key, value } of values) {
        if (value !== null) {
          result[key] = value
        }
      }
    }
    
    return result
  }

  /**
   * 批量设置
   * @param {Object<string, any>} items 键值对
   * @param {number} ttl 过期时间（毫秒）
   */
  async setMultiple(items, ttl) {
    if (!this.kv || !Object.keys(items).length) return false
    
    try {
      const promises = Object.entries(items).map(([key, value]) => 
        this.set(key, value, ttl)
      )
      
      await Promise.all(promises)
      return true
    } catch (e) {
      console.error('KV setMultiple error:', e)
      return false
    }
  }

  // ========== 业务方法 ==========

  /**
   * 获取匿名 Token
   */
  async getAnonymousToken() {
    return this.get('anonymous_token')
  }

  /**
   * 设置匿名 Token
   */
  async setAnonymousToken(token) {
    return this.set('anonymous_token', token, DEFAULT_TTL.ANONYMOUS_TOKEN)
  }

  /**
   * 获取设备 ID
   */
  async getDeviceId() {
    return this.get('device_id')
  }

  /**
   * 设置设备 ID
   */
  async setDeviceId(deviceId) {
    return this.set('device_id', deviceId, DEFAULT_TTL.DEVICE_ID)
  }

  /**
   * 获取 API 缓存
   * @param {string} cacheKey 缓存键
   */
  async getCache(cacheKey) {
    return this.getJSON(`cache:${cacheKey}`)
  }

  /**
   * 设置 API 缓存
   * @param {string} cacheKey 缓存键
   * @param {any} data 缓存数据
   * @param {number} ttl 过期时间（毫秒）
   */
  async setCache(cacheKey, data, ttl = DEFAULT_TTL.API_CACHE) {
    return this.setJSON(`cache:${cacheKey}`, data, ttl)
  }

  /**
   * 清除所有缓存
   */
  clearMemoryCache() {
    if (this.memoryCache) {
      this.memoryCache.clear()
    }
  }
}

// 导出 TTL 常量
export { DEFAULT_TTL, MemoryCacheLayer }