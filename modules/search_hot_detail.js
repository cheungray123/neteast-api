// 热搜列表
import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {}
  return request(`/api/hotsearchlist/get`, data, createOption(query, 'weapi'))
}
