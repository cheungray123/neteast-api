import { createOption } from '../util/option.js'
export default (query, request) => {
  return request(
    `/api/artist/head/info/get`,
    {
      id: query.id,
    },
    createOption(query),
  )
}
