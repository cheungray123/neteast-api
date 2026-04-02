// 相似歌手
import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    artistid: query.id,
  }
  return request(
    `/api/discovery/simiArtist`,
    data,
    createOption(query, 'weapi'),
  )
}
