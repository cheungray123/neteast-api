// MV链接

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    id: query.id,
    r: query.r || 1080,
  }
  return request(
    `/api/song/enhance/play/mv/url`,
    data,
    createOption(query, 'weapi'),
  )
}
