// 收藏与取消收藏歌手

import { createOption } from '../util/option.js'
export default (query, request) => {
  query.t = query.t == 1 ? 'sub' : 'unsub'
  const data = {
    artistId: query.id,
    artistIds: '[' + query.id + ']',
  }
  return request(`/api/artist/${query.t}`, data, createOption(query, 'weapi'))
}
