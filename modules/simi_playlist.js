// 相似歌单

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    songid: query.id,
    limit: query.limit || 50,
    offset: query.offset || 0,
  }
  return request(
    `/api/discovery/simiPlaylist`,
    data,
    createOption(query, 'weapi'),
  )
}
