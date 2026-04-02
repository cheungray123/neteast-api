// 歌手单曲

import { createOption } from '../util/option.js'
export default (query, request) => {
  return request(`/api/v1/artist/${query.id}`, {}, createOption(query, 'weapi'))
}
