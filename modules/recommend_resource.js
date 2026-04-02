// 每日推荐歌单

import { createOption } from '../util/option.js'
export default (query, request) => {
  return request(
    `/api/v1/discovery/recommend/resource`,
    {},
    createOption(query, 'weapi'),
  )
}
