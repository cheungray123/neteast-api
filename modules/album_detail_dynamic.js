// 专辑动态信息
import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    id: query.id,
  }
  return request(
    `/api/album/detail/dynamic`,
    data,
    createOption(query, 'weapi'),
  )
}
