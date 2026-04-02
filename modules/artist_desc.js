// 歌手介绍

import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    id: query.id,
  }
  return request(`/api/artist/introduction`, data, createOption(query, 'weapi'))
}
