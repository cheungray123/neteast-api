import { createOption } from '../util/option.js'
import { logger } from '../util/logger.js'
export default async (query, request) => {
  query.ids = query.ids || ''
  const data = {
    id: query.pid,
    tracks: JSON.stringify(
      query.ids.split(',').map((item) => {
        return { type: 3, id: item }
      }),
    ),
  }
  logger.info(data)

  return request(`/api/playlist/track/add`, data, createOption(query, 'weapi'))
}
