// 歌单详情

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    id: query.id,
    n: 100000,
    s: query.s || 8,
  }
  return request(`/api/v6/playlist/detail`, data, createOption(query))
}
