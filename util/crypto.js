/**
 * 加密模块
 * 使用 Web Crypto API 和纯 JS 实现（CF Workers 兼容）
 * 优化版本：缓存 RSA 公钥解析、优化重复计算
 */

import CryptoJS from 'crypto-js'

// 常量
const iv = '0102030405060708'
const presetKey = '0CoJUm6Qyw8W8jud'
const linuxapiKey = 'rFgB&h#%2?^eDg:Q'
const base62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const eapiKey = 'e82ckenh8dichen8'

// RSA 公钥（PEM 格式）
const publicKeyPem = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgtQn2JZ34ZC28NWYpAUd98iZ37BUrX/aKzmFbt7clFSs6sXqHauqKWqdtLkF2KexO40H1YTX8z2lSgBBOAxLsvaklV8k4cBFK9snQXE9/DDaFt6Rr7iVZMldczhC0JNgTz+SHXT6CBHuX3e9SdB1Ua44oncaTWz7OBGLbCiK45wIDAQAB
-----END PUBLIC KEY-----`

// 缓存解析后的 RSA modulus
let cachedModulus = null

/**
 * AES 加密
 */
function aesEncrypt(text, mode, key, ivValue, format = 'base64') {
  const encrypted = CryptoJS.AES.encrypt(
    CryptoJS.enc.Utf8.parse(text),
    CryptoJS.enc.Utf8.parse(key),
    {
      iv: CryptoJS.enc.Utf8.parse(ivValue || ''),
      mode: CryptoJS.mode[mode.toUpperCase()],
      padding: CryptoJS.pad.Pkcs7
    }
  )
  
  if (format === 'base64') {
    return encrypted.toString()
  }
  
  return encrypted.ciphertext.toString().toUpperCase()
}

/**
 * AES 解密
 */
function aesDecrypt(ciphertext, key, ivValue, format = 'base64') {
  let bytes
  
  if (format === 'base64') {
    bytes = CryptoJS.AES.decrypt(ciphertext, CryptoJS.enc.Utf8.parse(key), {
      iv: CryptoJS.enc.Utf8.parse(ivValue || ''),
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    })
  } else {
    bytes = CryptoJS.AES.decrypt(
      { ciphertext: CryptoJS.enc.Hex.parse(ciphertext) },
      CryptoJS.enc.Utf8.parse(key),
      {
        iv: CryptoJS.enc.Utf8.parse(ivValue || ''),
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      }
    )
  }
  
  return bytes.toString(CryptoJS.enc.Utf8)
}

/**
 * 字节数组转大整数
 */
function bytesToBigInt(bytes) {
  let result = BigInt(0)
  for (let i = 0; i < bytes.length; i++) {
    result = result * BigInt(256) + BigInt(bytes[i])
  }
  return result
}

/**
 * 模幂运算 (base^exp mod n)
 * 使用快速幂算法优化
 */
function modPow(base, exp, mod) {
  let result = BigInt(1)
  base = base % mod
  
  while (exp > 0) {
    if (exp % BigInt(2) === BigInt(1)) {
      result = (result * base) % mod
    }
    exp = exp / BigInt(2)
    base = (base * base) % mod
  }
  
  return result
}

/**
 * 解析 RSA 公钥（带缓存）
 */
function parseRSAPublicKey(pem) {
  if (cachedModulus !== null) {
    return cachedModulus
  }
  
  // 提取 Base64 部分
  const b64 = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '')
  
  // 解码 Base64
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  
  // 解析 DER 格式的公钥
  // 跳过 DER 头部，提取 modulus
  const modulusStart = 29 // DER 编码后的固定偏移
  const modulusBytes = bytes.slice(modulusStart, modulusStart + 128)
  
  cachedModulus = bytesToBigInt(modulusBytes)
  return cachedModulus
}

/**
 * RSA 加密
 */
function rsaEncrypt(str, publicKeyPem) {
  // 使用缓存的 modulus
  const modulus = cachedModulus || parseRSAPublicKey(publicKeyPem)
  
  // 将字符串转换为字节
  const bytes = new TextEncoder().encode(str)
  
  // 转换为大整数
  const m = bytesToBigInt(bytes)
  
  // RSA 加密: c = m^e mod n
  const e = BigInt(65537) // 标准公钥指数
  const c = modPow(m, e, modulus)
  
  // 转换为十六进制
  return c.toString(16)
}

/**
 * 生成随机密钥（优化版）
 */
function generateSecretKey() {
  let secretKey = ''
  for (let i = 0; i < 16; i++) {
    secretKey += base62.charAt(Math.floor(Math.random() * 62))
  }
  return secretKey
}

/**
 * WeAPI 加密
 */
function weapi(object) {
  const text = JSON.stringify(object)
  
  // 生成随机密钥
  const secretKey = generateSecretKey()
  
  // 双重 AES 加密
  const firstEncrypt = aesEncrypt(text, 'cbc', presetKey, iv)
  const secondEncrypt = aesEncrypt(firstEncrypt, 'cbc', secretKey, iv)
  
  // RSA 加密密钥
  const encSecKey = rsaEncrypt(secretKey.split('').reverse().join(''), publicKeyPem)
  
  return {
    params: secondEncrypt,
    encSecKey
  }
}

/**
 * LinuxAPI 加密
 */
function linuxapi(object) {
  const text = JSON.stringify(object)
  return {
    eparams: aesEncrypt(text, 'ecb', linuxapiKey, '', 'hex')
  }
}

/**
 * EAPI 加密
 */
function eapi(url, object) {
  const text = typeof object === 'object' ? JSON.stringify(object) : object
  const message = `nobody${url}use${text}md5forencrypt`
  const digest = CryptoJS.MD5(message).toString()
  const data = `${url}-36cd479b6b5-${text}-36cd479b6b5-${digest}`
  
  return {
    params: aesEncrypt(data, 'ecb', eapiKey, '', 'hex')
  }
}

/**
 * EAPI 响应解密
 */
function eapiResDecrypt(encryptedParams) {
  try {
    const decryptedData = aesDecrypt(encryptedParams, eapiKey, '', 'hex')
    return JSON.parse(decryptedData)
  } catch (error) {
    console.error('eapiResDecrypt error:', error)
    return null
  }
}

/**
 * EAPI 请求解密
 */
function eapiReqDecrypt(encryptedParams) {
  const decryptedData = aesDecrypt(encryptedParams, eapiKey, '', 'hex')
  const match = decryptedData.match(/(.*?)-36cd479b6b5-(.*?)-36cd479b6b5-(.*)/)
  
  if (match) {
    return {
      url: match[1],
      data: JSON.parse(match[2])
    }
  }
  
  return null
}

/**
 * 解密
 */
function decrypt(cipher) {
  const decipher = CryptoJS.AES.decrypt(
    { ciphertext: CryptoJS.enc.Hex.parse(cipher) },
    eapiKey,
    { mode: CryptoJS.mode.ECB }
  )
  return CryptoJS.enc.Utf8.stringify(decipher)
}

/**
 * MD5 哈希
 */
function md5(text) {
  return CryptoJS.MD5(text).toString()
}

// 初始化时预解析 RSA 公钥
parseRSAPublicKey(publicKeyPem)

// 导出
export const encrypt = {
  weapi,
  linuxapi,
  eapi,
  eapiResDecrypt,
  eapiReqDecrypt,
  decrypt,
  aesEncrypt,
  aesDecrypt,
  md5
}

export { 
  weapi, 
  linuxapi, 
  eapi, 
  eapiResDecrypt, 
  eapiReqDecrypt, 
  decrypt, 
  aesEncrypt, 
  aesDecrypt,
  md5
}