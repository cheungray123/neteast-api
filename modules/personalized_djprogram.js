// 推荐电台

import { createOption } from '../util/option.js'
export default (query, request) => {
  return request(
    `/api/personalized/djprogram`,
    {},
    createOption(query, 'weapi'),
  )
}
