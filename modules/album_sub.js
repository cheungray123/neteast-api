// 收藏/取消收藏专辑

import { createOption } from '../util/option.js'
export default (query, request) => {
  query.t = query.t == 1 ? 'sub' : 'unsub'
  const data = {
    id: query.id,
  }
  return request(`/api/album/${query.t}`, data, createOption(query, 'weapi'))
}
