import { createOption } from '../util/option.js'
export default (query, request) => {
  const data = {
    id: query.id,
    private_cloud: 'true',
    work_type: 1,
    order: query.order || 'hot', //hot,time
    offset: query.offset || 0,
    limit: query.limit || 100,
  }
  return request(`/api/v1/artist/songs`, data, createOption(query))
}
