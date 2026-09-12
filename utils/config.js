// config.js
// ============================================================
// 全局接口地址统一配置
// ------------------------------------------------------------
// 项目所有接口域名集中在本文件维护，切换环境（本地调试 / 生产）
// 只需修改本文件，无需改动任何页面代码。
//
// 注意事项：
// 1. 修改域名后，生产环境需在微信公众平台【开发管理-服务器域名】
//    中配置对应的 request / uploadFile 合法域名；
//    本地调试（http/localhost）需在微信开发者工具勾选
//    「不校验合法域名」（本项目 project.private.config.json
//    已设置 "urlCheck": false）。
// 2. API_BASE_URL 是 JWT Token 认证域名：utils/request.js 的
//    认证拦截器只对该域名生效（自动携带 Authorization 头、
//    保存 X-Auth-Token 续签、401 清 Token 跳登录页）。
//    修改此地址不影响本地已存的 Token（存储 key 为 auth_token）。
// ============================================================

// 【地址一】主服务端 AppletStoreApi（商周集团主 API）
// 用途：登录、退出、核销、会员、转赠、办卡等绝大多数业务接口
// 生产环境：https://applet.myszgroup.cn:7779
// 本地调试：http://localhost:44705
const API_BASE_URL = 'https://applet.myszgroup.cn:7779'

// 【地址二】商周备库服务（二手车/车辆客户数据）
// 用途：subpackages/member/api/MiniProgramApi.js 中的车辆查询、
//       客户信息、二手车估价等接口
// 生产环境：https://szbk.bjcls.cn:7718
// 备用 IP ：http://47.95.203.61:7718
const SZBK_BASE_URL = 'https://szbk.bjcls.cn:7718'

// 【地址三】福特车主服务（fordjoin 接口）
// 用途：按 VIN 查询福特客户、最新保养里程等
// 生产环境：https://szbk.bjcls.cn:5123
const FORDJOIN_BASE_URL = 'https://szbk.bjcls.cn:5123'

module.exports = {
  API_BASE_URL,
  SZBK_BASE_URL,
  FORDJOIN_BASE_URL
}
