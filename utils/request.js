// request.js
// 简单封装 wx.request，检测失败信息或响应中的登录失效标志，尝试 wx.login 并重试一次（best-effort）

function requestWithAuth(opts) {
  return new Promise((resolve, reject) => {
    const doRequest = (attempt = 0) => {
      try {
        wx.request(Object.assign({}, opts, {
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
  extractApiErrorMessage
}

// 提供 uploadFile 的安全封装，行为与 requestWithAuth 类似：在遇到登录失效时尝试 wx.login 并重试一次
function safeUploadFile(opts) {
  return new Promise((resolve, reject) => {
    const doUpload = (attempt = 0) => {
      try {
        wx.uploadFile(Object.assign({}, opts, {
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
