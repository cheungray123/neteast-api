// 推荐新歌

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    type: 'recommend',
    limit: query.limit || 10,
    areaId: query.areaId || 0,
  }
  return request(
    `/api/personalized/newsong`,
    data,
    createOption(query, 'weapi'),
  )
}
