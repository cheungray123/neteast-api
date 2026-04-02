# 网易云音乐 API - Cloudflare Workers 版

基于 Cloudflare Workers 的网易云音乐 API，无需服务器，全球边缘部署。

## 目录

- [特性](#特性)
- [快速开始](#快速开始)
- [部署指南](#部署指南)
- [配置说明](#配置说明)
- [API 接口文档](#api-接口文档)
- [使用示例](#使用示例)
- [性能优化](#性能优化)
- [常见问题](#常见问题)

## 特性

- **零服务器运维**：部署到 Cloudflare Workers，无需管理服务器
- **全球边缘部署**：Cloudflare CDN 全球节点，低延迟访问
- **自动扩展**：根据请求量自动扩展，无需手动配置
- **免费额度充足**：每日 10 万次请求，个人使用完全免费
- **登录状态支持**：支持二维码登录，获取个性化推荐
- **请求缓存**：内置内存缓存，减少重复请求
- **请求限流**：防止滥用，保护服务稳定
- **性能监控**：内置 `/metrics` 端点监控运行状态

## 快速开始

### 一键部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=[https://github.com/your-repo/ncm-api](https://github.com/cheungray123/neteast-api))

### 本地开发

```bash
# 克隆项目
git clone https://github.com/your-repo/ncm-api.git
cd ncm-api

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://127.0.0.1:8787
```

## 部署指南

### 前置要求

| 工具 | 版本要求 | 说明 |
|-----|---------|-----|
| Node.js | 18+ | 运行环境 |
| npm/pnpm | 最新版 | 包管理器 |
| Cloudflare 账号 | - | [免费注册](https://dash.cloudflare.com/sign-up) |

### 步骤一：安装依赖

```bash
npm install
```

### 步骤二：登录 Cloudflare

```bash
npx wrangler login
```

这会打开浏览器进行授权，授权完成后自动返回。

### 步骤三：获取账户 ID

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 右侧栏查看 **Account ID**
3. 更新到 `wrangler.toml` 中的 `account_id`

### 步骤四：创建 KV 命名空间

KV 用于存储登录状态和缓存数据：

```bash
# 创建开发环境 KV
npx wrangler kv:namespace create NCM_KV

# 创建生产环境 KV（可选）
npx wrangler kv:namespace create NCM_KV --preview
```

记录返回的 ID，更新到 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "NCM_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 步骤五：配置环境变量（可选）

创建 `.dev.vars` 文件用于本地开发：

```env
# 网易云音乐登录 Token（获取个性化推荐）
MUSIC_U=你的MUSIC_U值

# 指标访问密码
METRICS_PASSWORD=your-secure-password
```

### 步骤六：本地测试

```bash
npm run dev
```

访问 http://127.0.0.1:8787 测试各项接口。

### 步骤七：部署到生产环境

```bash
npm run deploy
```

部署成功后返回：

```
Published ncm-api (production)
  https://ncm-api.你的子域.workers.dev
```

### 步骤八：绑定自定义域名（可选）

**方式一：Dashboard 配置**

1. 进入 Workers -> 你的 Worker -> Settings -> Triggers
2. 点击 "Add Custom Domain"
3. 输入域名（需先在 Cloudflare 添加站点）

**方式二：配置文件**

```toml
# wrangler.toml
[[routes]]
pattern = "api.example.com/*"
zone_name = "example.com"
```

## 配置说明

### wrangler.toml 完整配置

```toml
name = "ncm-api"
main = "index.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# 账户配置
account_id = "你的Cloudflare账户ID"

# Workers 设置
workers_dev = true

# KV 命名空间绑定
[[kv_namespaces]]
binding = "NCM_KV"
id = "你的KV命名空间ID"

# 环境变量
[vars]
NODE_ENV = "production"
ENABLE_FLAC = "true"
# 允许访问的域名（多个用逗号分隔）
# ALLOWED_ORIGINS = "https://example.com,https://admin.example.com"
# 指标访问密码
# METRICS_PASSWORD = "your-secure-password"

# 生产环境配置
[env.production]
name = "ncm-api-prod"
workers_dev = false

# 生产环境 KV
[[env.production.kv_namespaces]]
binding = "NCM_KV"
id = "生产环境KV的ID"

# 定时任务（每小时清理缓存）
[triggers]
crons = ["0 * * * *"]

# CPU 时间限制
[limits]
cpu_ms = 50000

# 开发服务器配置
[dev]
port = 8787
local_protocol = "http"
```

### 环境变量说明

| 变量名 | 类型 | 默认值 | 说明 |
|-------|------|-------|-----|
| `MUSIC_U` | String | - | 网易云音乐登录 Token，用于获取个性化内容 |
| `NODE_ENV` | String | `production` | 运行环境 |
| `ENABLE_FLAC` | String | `true` | 是否启用无损音质 |
| `ALLOWED_ORIGINS` | String | `*` | 允许跨域访问的域名，多个用逗号分隔 |
| `METRICS_PASSWORD` | String | - | 访问 `/metrics` 端点的密码 |

### 获取 MUSIC_U Token

1. 打开 [网易云音乐网页版](https://music.163.com) 并登录
2. 按 `F12` 打开开发者工具
3. 切换到 **Application** (Chrome) 或 **存储** (Firefox) 标签
4. 展开 **Cookies** -> `https://music.163.com`
5. 找到 `MUSIC_U` 并复制其值

## API 接口文档

### 系统接口

| 接口 | 方法 | 说明 |
|-----|------|-----|
| `/` | GET | 服务状态、版本信息 |
| `/health` | GET | 健康检查 |
| `/modules` | GET | 获取所有可用模块列表 |
| `/metrics` | GET | 性能指标（可设置密码保护） |

### 搜索接口

#### `/search` - 搜索

**参数：**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|-------|------|------|-------|-----|
| `keywords` | String | ✅ | - | 搜索关键词 |
| `type` | Number | ❌ | 1 | 搜索类型 |
| `limit` | Number | ❌ | 30 | 返回数量，最大 100 |
| `offset` | Number | ❌ | 0 | 偏移量，用于分页 |

**type 类型说明：**

| 值 | 说明 |
|----|-----|
| 1 | 单曲 |
| 10 | 专辑 |
| 100 | 歌手 |
| 1000 | 歌单 |
| 1002 | 用户 |
| 1004 | MV |
| 1006 | 歌词 |
| 1009 | 电台 |
| 1014 | 视频 |

**示例：**

```bash
# 搜索单曲
curl "https://你的域名.workers.dev/search?keywords=周杰伦&limit=10"

# 搜索歌单
curl "https://你的域名.workers.dev/search?keywords=周杰伦&type=1000"

# 分页搜索
curl "https://你的域名.workers.dev/search?keywords=周杰伦&limit=10&offset=20"
```

#### `/search_suggest` - 搜索建议

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|-----|
| `keywords` | String | ✅ | 搜索关键词 |
| `type` | String | ❌ | `mobile` 或 `web` |

#### `/search_hot` - 热门搜索（简略）
#### `/search_hot_detail` - 热门搜索（详细）
#### `/search_default` - 默认搜索词
#### `/search_multimatch` - 多类型匹配

---

### 歌曲接口

#### `/song_detail` - 歌曲详情

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|-----|
| `ids` | String | ✅ | 歌曲ID，多个用逗号分隔，最多 1000 首 |

**示例：**

```bash
# 单首歌曲
curl "https://你的域名.workers.dev/song_detail?ids=255020"

# 多首歌曲
curl "https://你的域名.workers.dev/song_detail?ids=255020,255021,255022"
```

#### `/song_url` - 获取歌曲播放链接

**参数：**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|-------|------|------|-------|-----|
| `id` | String | ✅ | - | 歌曲ID，多个用逗号分隔 |
| `br` | Number | ❌ | 999000 | 码率 (bps) |

**码率说明：**

| 码率 | 音质 |
|-----|-----|
| 128000 | 标准音质 |
| 192000 | 较高音质 |
| 320000 | 高品质 |
| 999000 | 无损音质（需要 VIP） |

**响应字段：**

```json
{
  "code": 200,
  "data": [{
    "id": 255020,
    "url": "https://...",
    "br": 320000,
    "size": 10240000,
    "type": "mp3"
  }]
}
```

#### `/song_url_v1` - 获取歌曲链接（新版）

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|-----|
| `id` | String | ✅ | 歌曲ID |
| `level` | String | ❌ | 音质等级 |

**level 可选值：**

- `standard` - 标准
- `higher` - 较高
- `exhigh` - 高品质
- `lossless` - 无损
- `hires` - Hi-Res

#### `/lyric` - 获取歌词

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|-----|
| `id` | String | ✅ | 歌曲ID |

**响应字段：**

```json
{
  "code": 200,
  "lrc": {
    "lyric": "[00:00.00] 作词 : 方文山\n[00:01.00] 作曲 : 周杰伦\n..."
  },
  "tlyric": {
    "lyric": "翻译歌词..."
  },
  "romalrc": {
    "lyric": "罗马音歌词..."
  }
}
```

#### `/lyric_new` - 逐字歌词

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|-----|
| `id` | String | ✅ | 歌曲ID |

#### `/check_music` - 检查歌曲是否可用

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|-----|
| `id` | String | ✅ | 歌曲ID |

---

### 歌单接口

#### `/playlist_detail` - 歌单详情

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|-----|
| `id` | String | ✅ | 歌单ID |
| `s` | Number | ❌ | 歌单最近的 s 个收藏者，默认 8 |

**示例：**

```bash
curl "https://你的域名.workers.dev/playlist_detail?id=3778678"
```

#### `/playlist_track_all` - 歌单所有歌曲

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|-----|
| `id` | String | ✅ | 歌单ID |
| `limit` | Number | ❌ | 数量限制 |
| `offset` | Number | ❌ | 偏移量 |

#### `/playlist_hot` - 热门歌单分类
#### `/playlist_catlist` - 歌单分类列表
#### `/top_playlist` - 分类歌单
#### `/top_playlist_highquality` - 精品歌单
#### `/playlist_highquality_tags` - 精品歌单标签

#### `/playlist_tracks` - 歌单操作（需登录）

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|-----|
| `op` | String | ✅ | 操作：`add` 添加，`del` 删除 |
| `pid` | String | ✅ | 歌单ID |
| `tracks` | String | ✅ | 歌曲ID，多个用逗号分隔 |

---

### 排行榜接口

#### `/toplist` - 所有排行榜

**示例：**

```bash
curl "https://你的域名.workers.dev/toplist"
```

#### `/toplist_detail` - 排行榜详情
#### `/toplist_detail_v2` - 排行榜详情 V2

---

### 歌手接口

#### `/artist_detail` - 歌手详情

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|-----|
| `id` | String | ✅ | 歌手ID |

#### `/artist_songs` - 歌手歌曲

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|-----|
| `id` | String | ✅ | 歌手ID |
| `limit` | Number | ❌ | 数量限制 |
| `offset` | Number | ❌ | 偏移量 |

#### `/artist_album` - 歌手专辑

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|-----|
| `id` | String | ✅ | 歌手ID |
| `limit` | Number | ❌ | 数量限制 |
| `offset` | Number | ❌ | 偏移量 |

#### `/artist_mv` - 歌手 MV
#### `/artist_desc` - 歌手简介
#### `/artist_fans` - 歌手粉丝
#### `/artist_top_song` - 歌手热门歌曲
#### `/artist_sub` - 收藏/取消收藏歌手（需登录）
#### `/artist_sublist` - 收藏的歌手列表（需登录）
#### `/top_artists` - 热门歌手列表
#### `/artist_list` - 歌手分类列表

---

### 专辑接口

#### `/album` / `/album_detail` - 专辑详情

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|-----|
| `id` | String | ✅ | 专辑ID |

#### `/album_new` - 新专辑
#### `/album_newest` - 最新专辑
#### `/album_list` - 专辑列表
#### `/album_list_style` - 专辑风格列表
#### `/album_sub` - 收藏/取消收藏专辑（需登录）
#### `/album_sublist` - 收藏的专辑列表（需登录）
#### `/top_album` - 新碟上架

---

### 登录接口

#### `/login_qr_key` - 获取二维码 Key

**响应：**

```json
{
  "code": 200,
  "data": {
    "unikey": "xxxxxx"
  }
}
```

#### `/login_qr_create` - 生成二维码

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|-----|
| `key` | String | ✅ | 从 `/login_qr_key` 获取 |
| `qrimg` | Boolean | ❌ | 是否返回 base64 图片 |

**响应：**

```json
{
  "code": 200,
  "data": {
    "qrurl": "https://...",
    "qrimg": "data:image/png;base64,..."
  }
}
```

#### `/login_qr_check` - 检查扫码状态

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|-----|
| `key` | String | ✅ | 二维码 Key |

**状态码说明：**

| code | 说明 |
|------|-----|
| 800 | 二维码已过期 |
| 801 | 等待扫码 |
| 802 | 待确认（已扫码） |
| 803 | 授权登录成功 |

#### `/login_status` - 登录状态
#### `/login_refresh` - 刷新登录
#### `/register_anonimous` - 匿名注册

---

### 推荐接口（需登录）

| 接口 | 说明 |
|-----|-----|
| `/recommend_songs` | 每日推荐歌曲 |
| `/recommend_resource` | 每日推荐歌单 |
| `/personalized` | 推荐歌单 |
| `/personalized_newsong` | 推荐新歌 |
| `/personalized_mv` | 推荐 MV |
| `/personalized_djprogram` | 推荐电台 |
| `/personalized_privatecontent` | 独家放送 |

---

### 相似接口

| 接口 | 参数 | 说明 |
|-----|-----|-----|
| `/simi_song` | `id`: 歌曲ID | 相似歌曲 |
| `/simi_playlist` | `id`: 歌单ID | 相似歌单 |
| `/simi_artist` | `id`: 歌手ID | 相似歌手 |
| `/simi_mv` | `mvid`: MV ID | 相似 MV |

---

### MV 接口

#### `/mv_url` - MV 播放地址

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|-----|
| `id` | String | ✅ | MV ID |
| `r` | Number | ❌ | 分辨率，默认 1080 |

#### `/mv_detail` - MV 详情

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|-----|
| `mvid` | String | ✅ | MV ID |

#### `/top_mv` - MV 排行榜

---

### 其他接口

#### `/banner` - 轮播图

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|-----|
| `type` | Number | ❌ | 客户端类型 |

**type 值：**

| 值 | 说明 |
|----|-----|
| 0 | PC |
| 1 | Android |
| 2 | iPhone |
| 3 | iPad |

#### `/daily_signin` - 每日签到（需登录）
#### `/top_song` - 新歌速递
#### `/song_music_detail` - 歌曲音乐详情

---

## 使用示例

### cURL

```bash
# 搜索歌曲
curl "https://你的域名.workers.dev/search?keywords=周杰伦&limit=10"

# 获取歌曲详情
curl "https://你的域名.workers.dev/song_detail?ids=255020"

# 获取歌词
curl "https://你的域名.workers.dev/lyric?id=255020"

# 获取歌曲链接
curl "https://你的域名.workers.dev/song_url?id=255020&br=320000"

# 获取排行榜
curl "https://你的域名.workers.dev/toplist"

# 查看服务状态
curl "https://你的域名.workers.dev/"

# 查看性能指标
curl "https://你的域名.workers.dev/metrics"
```

### JavaScript / TypeScript

```javascript
const API_BASE = 'https://你的域名.workers.dev'

// 封装请求函数
async function request(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })
  
  const response = await fetch(url)
  return response.json()
}

// 搜索歌曲
async function search(keyword, limit = 30, offset = 0) {
  return request('/search', { keywords: keyword, limit, offset })
}

// 获取歌曲详情
async function getSongDetail(ids) {
  return request('/song_detail', { ids: Array.isArray(ids) ? ids.join(',') : ids })
}

// 获取歌曲链接
async function getSongUrl(id, br = 320000) {
  return request('/song_url', { id, br })
}

// 获取歌词
async function getLyric(id) {
  return request('/lyric', { id })
}

// 使用示例
async function main() {
  // 搜索
  const searchResult = await search('周杰伦', 10)
  console.log('搜索结果:', searchResult.result.songs)
  
  // 获取详情
  const songId = searchResult.result.songs[0].id
  const detail = await getSongDetail(songId)
  console.log('歌曲详情:', detail)
  
  // 获取歌词
  const lyric = await getLyric(songId)
  console.log('歌词:', lyric.lrc.lyric)
  
  // 获取播放链接
  const songUrl = await getSongUrl(songId)
  console.log('播放链接:', songUrl.data[0].url)
}

main()
```

### Python

```python
import requests

API_BASE = 'https://你的域名.workers.dev'

def search(keyword, limit=30, offset=0):
    """搜索歌曲"""
    response = requests.get(f'{API_BASE}/search', params={
        'keywords': keyword,
        'limit': limit,
        'offset': offset
    })
    return response.json()

def get_song_detail(ids):
    """获取歌曲详情"""
    if isinstance(ids, list):
        ids = ','.join(map(str, ids))
    response = requests.get(f'{API_BASE}/song_detail', params={'ids': ids})
    return response.json()

def get_song_url(id, br=320000):
    """获取歌曲播放链接"""
    response = requests.get(f'{API_BASE}/song_url', params={'id': id, 'br': br})
    return response.json()

def get_lyric(id):
    """获取歌词"""
    response = requests.get(f'{API_BASE}/lyric', params={'id': id})
    return response.json()

# 使用示例
if __name__ == '__main__':
    # 搜索
    result = search('周杰伦', limit=10)
    print(f"找到 {result['result']['songCount']} 首歌曲")
    
    # 获取第一首歌的信息
    song = result['result']['songs'][0]
    song_id = song['id']
    print(f"歌曲: {song['name']} - {song['artists'][0]['name']}")
    
    # 获取歌词
    lyric = get_lyric(song_id)
    print(lyric['lrc']['lyric'][:200])
```

### 需要登录的接口

**方式一：请求头传递 Cookie**

```javascript
const API_BASE = 'https://你的域名.workers.dev'
const MUSIC_U = '你的MUSIC_U值'

// 获取每日推荐歌曲
async function getRecommendSongs() {
  const response = await fetch(`${API_BASE}/recommend_songs`, {
    headers: {
      'Cookie': `MUSIC_U=${MUSIC_U}`
    }
  })
  return response.json()
}

// 获取每日推荐歌单
async function getRecommendResource() {
  const response = await fetch(`${API_BASE}/recommend_resource`, {
    headers: {
      'Cookie': `MUSIC_U=${MUSIC_U}`
    }
  })
  return response.json()
}
```

**方式二：环境变量配置（推荐）**

在 Cloudflare Dashboard 设置环境变量：

1. Workers -> 你的 Worker -> Settings -> Variables
2. 添加变量 `MUSIC_U`，值填入你的 Token
3. 保存后即可直接调用需要登录的接口

```javascript
// 环境变量配置后，无需传递 Cookie
async function getRecommendSongs() {
  const response = await fetch(`${API_BASE}/recommend_songs`)
  return response.json()
}
```

### 二维码登录流程

```javascript
const API_BASE = 'https://你的域名.workers.dev'

async function qrLogin() {
  // 1. 获取二维码 Key
  const keyRes = await fetch(`${API_BASE}/login_qr_key`)
  const keyData = await keyRes.json()
  const key = keyData.data.unikey
  
  // 2. 生成二维码
  const qrRes = await fetch(`${API_BASE}/login_qr_create?key=${key}&qrimg=true`)
  const qrData = await qrRes.json()
  
  console.log('请扫描二维码登录：')
  console.log(qrData.data.qrimg) // base64 图片
  
  // 3. 轮询检查状态
  const checkLogin = async () => {
    const checkRes = await fetch(`${API_BASE}/login_qr_check?key=${key}`)
    const checkData = await checkRes.json()
    
    switch (checkData.code) {
      case 800:
        console.log('二维码已过期，请重新获取')
        return null
      case 801:
        console.log('等待扫码...')
        await new Promise(r => setTimeout(r, 2000))
        return checkLogin()
      case 802:
        console.log('已扫码，等待确认...')
        await new Promise(r => setTimeout(r, 2000))
        return checkLogin()
      case 803:
        console.log('登录成功！')
        return checkData.cookie // 返回 cookie
    }
  }
  
  return checkLogin()
}

qrLogin().then(cookie => {
  if (cookie) {
    console.log('Cookie:', cookie)
    // 保存 cookie 用于后续请求
  }
})
```

## 性能优化

### 内置优化

项目已内置以下性能优化：

| 功能 | 说明 |
|-----|-----|
| **请求缓存** | 内存缓存层，相同请求 60 秒内直接返回缓存 |
| **请求超时** | 10 秒超时保护，防止请求阻塞 |
| **自动重试** | 失败后自动重试最多 2 次 |
| **请求限流** | 每 IP 每分钟最多 100 次请求 |
| **KV 缓存** | 登录状态等数据存储到 KV |
| **Cron 清理** | 定时清理过期缓存 |

### 查看性能指标

```bash
# 无密码
curl "https://你的域名.workers.dev/metrics"

# 有密码
curl "https://你的域名.workers.dev/metrics?password=your-password"
# 或
curl "https://你的域名.workers.dev/metrics" -H "X-Metrics-Password: your-password"
```

**响应示例：**

```json
{
  "uptime_seconds": 3600,
  "requests_total": 1234,
  "errors_total": 5,
  "avg_response_time_ms": 120,
  "memory_cache_size": 45,
  "rate_limit": {
    "windowMs": 60000,
    "maxRequests": 100,
    "enabled": true
  }
}
```

### 响应头说明

每个 API 响应都包含以下性能头：

| Header | 说明 |
|--------|-----|
| `X-Response-Time` | 请求处理时间（毫秒） |
| `X-Cache-Status` | `HIT` 缓存命中，`MISS` 缓存未命中 |

## 常见问题

### Q: 部署后访问报错？

**检查步骤：**

1. 确认 `account_id` 正确
2. 确认 KV 命名空间 ID 已配置
3. 查看 Workers 日志：`npm run tail`
4. 查看 Dashboard 日志：Workers -> 你的 Worker -> Logs

### Q: 如何获取 MUSIC_U Token？

1. 打开 [网易云音乐网页版](https://music.163.com) 并登录
2. 按 `F12` 打开开发者工具
3. 切换到 **Application** -> **Cookies** -> `https://music.163.com`
4. 找到 `MUSIC_U` 并复制其值

### Q: 歌曲链接返回 403？

部分歌曲因版权限制无法播放，返回 403 是正常现象。建议：

1. 使用登录后的账号获取链接
2. 尝试其他歌曲

### Q: 如何绑定自定义域名？

**方式一：Dashboard 配置**

1. 在 Cloudflare 添加你的域名
2. Workers -> 你的 Worker -> Settings -> Triggers
3. Add Custom Domain

**方式二：配置文件**

```toml
[[routes]]
pattern = "api.example.com/*"
zone_name = "example.com"
```

### Q: 如何限制访问域名？

设置 `ALLOWED_ORIGINS` 环境变量：

```toml
[vars]
ALLOWED_ORIGINS = "https://example.com,https://admin.example.com"
```

或在 Dashboard 设置：Workers -> 你的 Worker -> Settings -> Variables

### Q: 免费额度够用吗？

Cloudflare Workers 免费计划：

| 资源 | 免费额度 |
|-----|---------|
| 请求数 | 10 万次/天 |
| CPU 时间 | 10ms/请求 |
| KV 读取 | 10 万次/天 |
| KV 写入 | 1000 次/天 |

个人使用完全足够。如果需要更多，可升级到付费计划（$5/月起）。

### Q: 如何查看实时日志？

```bash
npm run tail
```

或在 Dashboard：Workers -> 你的 Worker -> Logs -> Begin log stream

### Q: 本地开发 KV 不可用？

本地开发时 KV 使用模拟存储，重启后数据会丢失。生产环境会使用真实 KV。

### Q: 如何更新项目？

```bash
git pull
npm install
npm run deploy
```

## 项目结构

```
music/
├── index.js              # 入口文件，Hono 应用、中间件、路由
├── request.js            # 请求处理与路由分发
├── package.json          # 项目配置
├── wrangler.toml         # Cloudflare Workers 配置
├── .dev.vars             # 本地环境变量（不提交）
│
├── modules/              # API 模块目录
│   ├── index.js          # 模块导出索引
│   ├── search.js         # 搜索模块
│   ├── song_*.js         # 歌曲相关模块
│   ├── playlist_*.js     # 歌单相关模块
│   ├── artist_*.js       # 歌手相关模块
│   ├── album_*.js        # 专辑相关模块
│   ├── login_*.js        # 登录相关模块
│   └── ...               # 其他模块
│
└── util/                 # 工具函数目录
    ├── crypto.js         # 加密模块（AES/RSA）
    ├── fetch.js          # 请求模块（缓存/重试/超时）
    ├── helper.js         # 辅助函数
    ├── kv-store.js       # KV 存储封装
    ├── logger.js         # 日志模块
    └── option.js         # 请求选项配置
```

## 开发命令

```bash
# 安装依赖
npm install

# 本地开发（热重载）
npm run dev

# 部署到生产环境
npm run deploy

# 查看实时日志
npm run tail

# 更新 wrangler
npm install wrangler@latest
```

## 技术栈

- **运行时**: Cloudflare Workers (V8 Isolate)
- **框架**: [Hono](https://hono.dev/) - 轻量级 Web 框架
- **加密**: CryptoJS (AES) + 纯 JS RSA 实现
- **存储**: Cloudflare KV

## License

MIT
