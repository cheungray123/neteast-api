// 所有榜单内容摘要

import { createOption } from '../util/option.js'
export default (query, request) => {
  return request(`/api/toplist/detail`, {}, createOption(query, 'weapi'))
}
