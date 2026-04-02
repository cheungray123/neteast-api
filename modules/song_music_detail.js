// 歌曲音质详情

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    songId: query.id,
  }
  return request(`/api/song/music/detail/get`, data, createOption(query))
}
