// 热门歌手

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    limit: query.limit || 50,
    offset: query.offset || 0,
    total: true,
  }
  return request(`/api/artist/top`, data, createOption(query, 'weapi'))
}
