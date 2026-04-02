// 关注歌手列表

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    limit: query.limit || 25,
    offset: query.offset || 0,
    total: true,
  }
  return request(`/api/artist/sublist`, data, createOption(query, 'weapi'))
}
