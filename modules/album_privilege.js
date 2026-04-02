// 获取专辑歌曲的音质

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    id: query.id,
  }
  return request(`/api/album/privilege`, data, createOption(query))
}
