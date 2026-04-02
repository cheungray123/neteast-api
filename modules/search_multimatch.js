// 多类型搜索

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    type: query.type || 1,
    s: query.keywords || '',
  }
  return request(
    `/api/search/suggest/multimatch`,
    data,
    createOption(query, 'weapi'),
  )
}
