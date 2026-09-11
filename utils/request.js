// request.js
// 简单封装 wx.request，检测失败信息或响应中的登录失效标志，尝试 wx.login 并重试一次（best-effort）

// ==================== JWT Token 认证层 ====================
// 仅对该域名的接口启用 JWT 认证（其他域名如 szbk.bjcls.cn 不受影响）
const AUTH_BASE_URL = 'http://localhost:44705'
const TOKEN_STORAGE_KEY = 'auth_token'
// 401 时跳转的登录页
const LOGIN_PAGE_ROUTE = 'pages/scan/scan'

function isAuthUrl(url) {
  return typeof url === 'string' && url.indexOf(AUTH_BASE_URL) === 0
}

function getAuthToken() {
  try {
    return wx.getStorageSync(TOKEN_STORAGE_KEY) || ''
  } catch (e) {
    return ''
  }
}

function setAuthToken(token) {
  try {
    wx.setStorageSync(TOKEN_STORAGE_KEY, token)
  } catch (e) {
    console.error('setAuthToken failed', e)
  }
}

function clearAuthToken() {
  try {
    wx.removeStorageSync(TOKEN_STORAGE_KEY)
  } catch (e) {
    console.error('clearAuthToken failed', e)
  }
}

// 从响应 Header 中按不区分大小写读取 X-Auth-Token（登录签发 / 滑动续签）
function readTokenFromHeader(header) {
  if (!header || typeof header !== 'object') return ''
  for (const key in header) {
    if (Object.prototype.hasOwnProperty.call(header, key) &&
        key.toLowerCase() === 'x-auth-token') {
      return header[key] || ''
    }
  }
  return ''
}

// 401 统一处理：清除 Token 并跳转登录页。
// redirecting401 去重：并发多个 401 只触发一次跳转；登录页自身 401 不跳转（防死循环）。
let redirecting401 = false

function handleUnauthorized() {
  clearAuthToken()
  try {
    const app = getApp()
    if (app && typeof app.clearLoginState === 'function') {
      app.clearLoginState()
    }
  } catch (e) {
    // ignore
  }
  try {
    const pages = getCurrentPages()
    const currentRoute = pages && pages.length ? (pages[pages.length - 1].route || '') : ''
    if (currentRoute === LOGIN_PAGE_ROUTE) return
  } catch (e) {
    // ignore
  }
  if (redirecting401) return
  redirecting401 = true
  wx.reLaunch({
    url: '/' + LOGIN_PAGE_ROUTE,
    complete: () => {
      setTimeout(() => { redirecting401 = false }, 1000)
    }
  })
}

// 对指定域名的请求：发出前注入 Authorization 头，返回后保存续签 Token、处理 401。
// opts / origSuccess / origFail 与 wx.request 回调签名一致。
function applyAuthInterceptor(opts) {
  const newOpts = Object.assign({}, opts)
  if (!isAuthUrl(newOpts.url)) return newOpts

  // 请求拦截：本地有 Token 则统一携带（白名单接口带上也会被服务端忽略）；
  // 原有自定义 Header（thirdsession、state 等）原样保留
  const token = getAuthToken()
  if (token) {
    newOpts.header = Object.assign({}, newOpts.header, {
      'Authorization': 'Bearer ' + token
    })
  }

  // 响应拦截
  const origSuccess = newOpts.success
  const origFail = newOpts.fail
  newOpts.success = function (res) {
    const refreshed = readTokenFromHeader(res && res.header)
    if (refreshed) setAuthToken(refreshed)
    if (res && res.statusCode === 401) {
      handleUnauthorized()
      if (typeof origFail === 'function') {
        origFail({ errMsg: 'request:fail 登录已失效(401)', statusCode: 401 })
      }
      return
    }
    if (typeof origSuccess === 'function') origSuccess(res)
  }
  return newOpts
}

// wx.request 的直接替代品（签名完全一致），自动完成 Token 注入 / 续签保存 / 401 处理
function authRequest(opts) {
  return wx.request(applyAuthInterceptor(opts))
}

// wx.uploadFile 的直接替代品，同样自动处理 Token
function authUploadFile(opts) {
  return wx.uploadFile(applyAuthInterceptor(opts))
}
// ==================== JWT Token 认证层 END ====================

function requestWithAuth(opts) {
  return new Promise((resolve, reject) => {
    const doRequest = (attempt = 0) => {
      try {
        authRequest(Object.assign({}, opts, {
          success: res => {
            // 如果后端使用特定字段标识未登录（例如 result_code !== '0' 且 result_code 为某个登录错误），
            // 请根据后端实际返回进行调整。这里做通用处理：如果响应包含 errcode 且非 0，或返回的 msg 标识 INVALID_LOGIN
            try {
              const body = res.data
              const msgStr = JSON.stringify(body || '')
              if (msgStr.indexOf('INVALID_LOGIN') !== -1 || msgStr.indexOf('access_token expired') !== -1) {
                if (attempt === 0) {
                  // 重新登录并重试一次
                  wx.login({
                    success: () => {
                      doRequest(attempt + 1)
                    },
                    fail: errLogin => {
                      console.error('requestWithAuth: wx.login failed', errLogin)
                      reject(res)
                    }
                  })
                  return
                }
              }
            } catch (e) {
              // ignore
            }
            // 正常返回
            resolve(res)
          },
          fail: err => {
            const msg = err && (err.errMsg || err.message) ? (err.errMsg || err.message) : String(err)
            if ((msg.indexOf('INVALID_LOGIN') !== -1 || msg.indexOf('access_token expired') !== -1) && attempt === 0) {
              // 重新登录并重试
              wx.login({
                success: () => {
                  doRequest(attempt + 1)
                },
                fail: errLogin => {
                  console.error('requestWithAuth: wx.login failed', errLogin)
                  reject(err)
                }
              })
              return
            }
            reject(err)
          }
        }))
      } catch (e) {
        reject(e)
      }
    }
    doRequest(0)
  })
}

function extractApiErrorMessage(err, fallbackMsg) {
  const fallback = fallbackMsg || '请求失败';
  if (!err) return fallback;

  if (typeof err === 'string') return err;
  if (err.result_msg) return err.result_msg;
  if (err.msg) return err.msg;
  if (err.message) return err.message;

  const data = err.data || err;
  if (data && typeof data === 'object') {
    if (data.result_msg) return data.result_msg;
    if (data.msg) return data.msg;
    if (data.errMsg) return data.errMsg;
  }

  if (err.errMsg) return err.errMsg;
  return fallback;
}

function createApiError(errOrMsg, fallbackMsg) {
  const msg = extractApiErrorMessage(errOrMsg, fallbackMsg);
  const e = new Error(msg);
  e.result_msg = msg;
  if (errOrMsg && typeof errOrMsg === 'object') {
    e.raw = errOrMsg;
    if (errOrMsg.data) e.data = errOrMsg.data;
  }
  return e;
}

// 统一业务返回格式处理：
// - 标准成功（result_code=0 或 is_success=true）=> resolve(data)
// - 标准失败 => reject(Error)，错误信息为 result_msg/msg
// - 非标准格式 => 直接 resolve(data)
function requestApi(opts) {
  return requestWithAuth(opts)
    .then(res => {
      const body = res && typeof res.data !== 'undefined' ? res.data : {};
      const hasStandardCode =
        body &&
        Object.prototype.hasOwnProperty.call(body, 'result_code');
      const hasStandardSuccess =
        body &&
        Object.prototype.hasOwnProperty.call(body, 'is_success');

      if (!hasStandardCode && !hasStandardSuccess) {
        return body;
      }

      const code = body.result_code;
      const isSuccess =
        code === '0' || code === 0 || body.is_success === true;

      if (!isSuccess) {
        return Promise.reject(createApiError(body, '接口请求失败'));
      }

      return body;
    })
    .catch(err => {
      return Promise.reject(createApiError(err, '网络请求失败'));
    });
}

module.exports = {
  requestWithAuth,
  requestApi,
  extractApiErrorMessage,
  authRequest,
  authUploadFile,
  getAuthToken,
  setAuthToken,
  clearAuthToken
}

// 提供 uploadFile 的安全封装，行为与 requestWithAuth 类似：在遇到登录失效时尝试 wx.login 并重试一次
function safeUploadFile(opts) {
  return new Promise((resolve, reject) => {
    const doUpload = (attempt = 0) => {
      try {
        authUploadFile(Object.assign({}, opts, {
          success: res => {
            try {
              const body = res.data
              const msgStr = JSON.stringify(body || '')
              if (msgStr.indexOf('INVALID_LOGIN') !== -1 || msgStr.indexOf('access_token expired') !== -1) {
                if (attempt === 0) {
                  wx.login({
                    success: () => {
                      doUpload(attempt + 1)
                    },
                    fail: errLogin => {
                      console.error('safeUploadFile: wx.login failed', errLogin)
                      reject(res)
                    }
                  })
                  return
                }
              }
            } catch (e) {
              // ignore
            }
            resolve(res)
          },
          fail: err => {
            const msg = err && (err.errMsg || err.message) ? (err.errMsg || err.message) : String(err)
            if ((msg.indexOf('INVALID_LOGIN') !== -1 || msg.indexOf('access_token expired') !== -1) && attempt === 0) {
              wx.login({
                success: () => {
                  doUpload(attempt + 1)
                },
                fail: errLogin => {
                  console.error('safeUploadFile: wx.login failed', errLogin)
                  reject(err)
                }
              })
              return
            }
            reject(err)
          }
        }))
      } catch (e) {
        reject(e)
      }
    }
    doUpload(0)
  })
}

module.exports = Object.assign(module.exports, { safeUploadFile })
