// MV详情

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    id: query.mvid,
  }
  return request(`/api/v1/mv/detail`, data, createOption(query, 'weapi'))
}
