/**
 * 请求处理与路由模块
 * CF Workers 版本
 */

import { createFetchRequest } from './util/fetch.js'
import { KVStore } from './util/kv-store.js'
import { createOption } from './util/option.js'

// 导入所有 API 模块（静态导入）
// 注意：需要构建时生成此导入列表
import * as modules from './modules/index.js'

// 特殊路由映射
const specialRoutes = {
  '/daily_signin': 'daily_signin',
  '/fm_trash': 'fm_trash',
  '/personal_fm': 'personal_fm'
}

/**
 * 路径转模块名
 */
function pathToModuleName(path) {
  // 移除前导斜杠
  let name = path.replace(/^\//, '')
  
  // 检查特殊路由
  if (specialRoutes['/' + name]) {
    return specialRoutes['/' + name]
  }
  
  // 将 / 转换为 _
  name = name.replace(/\//g, '_')
  
  return name
}

/**
 * 获取所有可用模块名（用于调试）
 */
export function getAvailableModules() {
  return Object.keys(modules)
}

/**
 * 处理 API 请求
 */
export async function handleRequest(path, params, env) {
  const moduleName = pathToModuleName(path)
  const module = modules[moduleName]
  
  if (!module) {
    return {
      status: 404,
      body: {
        code: 404,
        data: null,
        msg: `API not found: ${path}`
      },
      cookie: []
    }
  }
  
  // 初始化 KV 存储
  const kvStore = new KVStore(env.NCM_KV)
  
  // 创建请求函数
  const request = createFetchRequest(kvStore, env)
  
  // 调用模块
  try {
    const result = await module(params, request)
    return result
  } catch (error) {
    // 处理模块抛出的响应错误
    if (error.status && error.body) {
      return error
    }
    throw error
  }
}

// 导出模块映射（用于构建时生成）
export const moduleList = Object.keys(modules)
