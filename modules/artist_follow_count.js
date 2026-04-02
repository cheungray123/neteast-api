// 歌手粉丝数量

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    id: query.id,
  }
  return request(
    `/api/artist/follow/count/get`,
    data,
    createOption(query, 'weapi'),
  )
}
