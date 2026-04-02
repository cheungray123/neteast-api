// 默认搜索关键词

import { createOption } from '../util/option.js'
export default (query, request) => {
  return request(`/api/search/defaultkeyword/get`, {}, createOption(query))
}
