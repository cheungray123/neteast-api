// 歌手热门 50 首歌曲
import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    id: query.id,
  }
  return request(`/api/artist/top/song`, data, createOption(query, 'weapi'))
}
