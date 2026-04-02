// 所有榜单内容摘要v2

import { createOption } from '../util/option.js'
export default (query, request) => {
  return request(`/api/toplist/detail/v2`, {}, createOption(query, 'weapi'))
}
