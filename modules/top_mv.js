// MV排行榜

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    area: query.area || '',
    limit: query.limit || 30,
    offset: query.offset || 0,
    total: true,
  }
  return request(`/api/mv/toplist`, data, createOption(query, 'weapi'))
}
