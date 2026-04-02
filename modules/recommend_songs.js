// 每日推荐歌曲

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {}
  return request(
    `/api/v3/discovery/recommend/songs`,
    data,
    createOption(query, 'weapi'),
  )
}
