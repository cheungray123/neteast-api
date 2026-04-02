// 相似MV

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    mvid: query.mvid,
  }
  return request(`/api/discovery/simiMV`, data, createOption(query, 'weapi'))
}
