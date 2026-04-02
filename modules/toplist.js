// 所有榜单介绍

import { createOption } from '../util/option.js'
export default (query, request) => {
  return request(`/api/toplist`, {}, createOption(query))
}
