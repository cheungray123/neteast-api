// 数字专辑详情
import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    id: query.id,
  }
  return request(
    `/api/vipmall/albumproduct/detail`,
    data,
    createOption(query, 'weapi'),
  )
}
