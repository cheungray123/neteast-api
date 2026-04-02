// 全部歌单分类

import { createOption } from '../util/option.js'
export default (query, request) => {
  return request(`/api/playlist/catalogue`, {}, createOption(query, 'eapi'))
}
