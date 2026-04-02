// 歌词

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    id: query.id,
    tv: -1,
    lv: -1,
    rv: -1,
    kv: -1,
    _nmclfl: 1,
  }
  return request(`/api/song/lyric`, data, createOption(query))
}
