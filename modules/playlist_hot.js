// 热门歌单分类

import { createOption } from '../util/option.js'
export default (query, request) => {
  return request(`/api/playlist/hottags`, {}, createOption(query, 'weapi'))
}
