// 专辑内容

import { createOption } from '../util/option.js'
export default (query, request) => {
  return request(`/api/v1/album/${query.id}`, {}, createOption(query, 'weapi'))
}
