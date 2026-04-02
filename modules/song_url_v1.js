// 歌曲链接 - v1 (CF Workers 简化版)
import { createOption } from '../util/option.js'

export default async (query, request) => {
  const data = {
    ids: '[' + query.id + ']',
    level: query.level,
    encodeType: 'flac',
  }
  
  if (data.level == 'sky') {
    data.immerseType = 'c51'
  }
  
  return request('/api/song/enhance/player/url/v1', data, createOption(query))
}
