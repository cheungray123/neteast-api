// 独家放送

import { createOption } from '../util/option.js'
export default (query, request) => {
  return request(
    `/api/personalized/privatecontent`,
    {},
    createOption(query, 'weapi'),
  )
}
