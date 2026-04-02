// 登录二维码生成 (CF Workers 简化版)

function generateChainId(cookie) {
  const version = 'v1'
  const randomNum = Math.floor(Math.random() * 1e6)
  const deviceId = 'worker-' + randomNum
  const platform = 'web'
  const action = 'login'
  const timestamp = Date.now()
  return version + '_' + deviceId + '_' + platform + '_' + action + '_' + timestamp
}

export default (query) => {
  return new Promise(async (resolve) => {
    const platform = query.platform || 'pc'
    const cookie = query.cookie || ''

    let url = 'https://music.163.com/login?codekey=' + query.key

    if (platform === 'web') {
      const chainId = generateChainId(cookie)
      url += '&chainId=' + chainId
    }
    
    return resolve({
      code: 200,
      status: 200,
      body: {
        code: 200,
        data: {
          qrurl: url,
          qrimg: null  // CF Workers 不支持 qrcode 库
        }
      }
    })
  })
}
