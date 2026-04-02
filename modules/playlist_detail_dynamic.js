// 歌单动态信息

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    id: query.id,
    n: 100000,
    s: query.s || 8,
  }
  return request(`/api/playlist/detail/dynamic`, data, createOption(query))
}
