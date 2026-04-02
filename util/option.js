/**
 * 创建请求选项
 */

export function createOption(query, crypto = '') {
  return {
    crypto: query.crypto || crypto || '',
    cookie: query.cookie || {},
    ua: query.ua || '',
    proxy: query.proxy, // CF Workers 不支持代理，保留字段用于兼容
    realIP: query.realIP,
    randomCNIP: query.randomCNIP || false,
    e_r: query.e_r !== undefined ? query.e_r : undefined,
    domain: query.domain || '',
    checkToken: query.checkToken || false
  }
}
