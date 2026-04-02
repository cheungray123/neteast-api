// 搜索建议pc端

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    keyword: query.keyword || '',
  }
  return request(
    `/api/search/pc/suggest/keyword/get`,
    data,
    createOption(query),
  )
}
