// 歌手粉丝

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    id: query.id,
    limit: query.limit || 20,
    offset: query.offset || 0,
  }
  return request(`/api/artist/fans/get`, data, createOption(query, 'weapi'))
}
