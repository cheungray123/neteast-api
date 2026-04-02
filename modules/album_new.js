// 全部新碟
import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    limit: query.limit || 30,
    offset: query.offset || 0,
    total: true,
    area: query.area || 'ALL', //ALL:全部,ZH:华语,EA:欧美,KR:韩国,JP:日本
  }
  return request(`/api/album/new`, data, createOption(query, 'weapi'))
}
