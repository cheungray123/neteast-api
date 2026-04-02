// 推荐MV

import { createOption } from '../util/option.js'
export default (query, request) => {
  return request(`/api/personalized/mv`, {}, createOption(query, 'weapi'))
}
