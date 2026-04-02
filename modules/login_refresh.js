// 登录刷新

import { createOption } from '../util/option.js'
export default async (query, request) => {
  let result = await request(
    `/api/login/token/refresh`,
    {},
    createOption(query),
  )
  if (result.body.code === 200) {
    result = {
      status: 200,
      body: {
        ...result.body,
        cookie: result.cookie.join(';'),
      },
      cookie: result.cookie,
    }
  }
  return result
}
