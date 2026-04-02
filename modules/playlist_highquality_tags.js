// 精品歌单 tags
import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {}
  return request(
    `/api/playlist/highquality/tags`,
    data,
    createOption(query, 'weapi'),
  )
}
