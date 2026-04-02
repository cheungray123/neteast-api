// 注册匿名用户 (CF Workers 版本)
import CryptoJS from 'crypto-js'
import { createOption } from '../util/option.js'

const ID_XOR_KEY_1 = '3go8&$8*3*3h0k(2)2'

function generateDeviceId() {
  const hexChars = '0123456789ABCDEF'
  const chars = []
  for (let i = 0; i < 52; i++) {
    chars.push(hexChars[Math.floor(Math.random() * 16)])
  }
  return chars.join('')
}

function cloudmusic_dll_encode_id(some_id) {
  let xoredString = ''
  for (let i = 0; i < some_id.length; i++) {
    const charCode =
      some_id.charCodeAt(i) ^ ID_XOR_KEY_1.charCodeAt(i % ID_XOR_KEY_1.length)
    xoredString += String.fromCharCode(charCode)
  }
  const wordArray = CryptoJS.enc.Utf8.parse(xoredString)
  const digest = CryptoJS.MD5(wordArray)
  return CryptoJS.enc.Base64.stringify(digest)
}

export default async (query, request) => {
  const deviceId = generateDeviceId()
  const encodedId = CryptoJS.enc.Base64.stringify(
    CryptoJS.enc.Utf8.parse(
      deviceId + ' ' + cloudmusic_dll_encode_id(deviceId),
    ),
  )
  const data = {
    username: encodedId,
  }
  let result = await request(
    '/api/register/anonimous',
    data,
    createOption(query, 'weapi'),
  )
  if (result.body.code === 200) {
    result = {
      status: 200,
      body: {
        ...result.body,
        cookie: result.cookie.join(';'),
      },
      cookie: result.cookie,
    }
  }
  return result
}
