// 热门搜索

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    type: 1111,
  }
  return request(`/api/search/hot`, data, createOption(query))
}
