// safeStorage.js
// 提供对 wx.setStorageSync / wx.getStorageSync 的安全封装，
// 在遇到 INVALID_LOGIN / access_token expired 时尝试一次 wx.login 重试（best-effort）

function safeSetStorageSync(key, data) {
  try {
    return wx.setStorageSync(key, data)
  } catch (e) {
    const msg = (e && (e.errMsg || e.message)) ? (e.errMsg || e.message) : String(e)
    console.error('safeSetStorageSync failed:', msg, e)
    if (msg.indexOf('INVALID_LOGIN') !== -1 || msg.indexOf('access_token expired') !== -1) {
      // 异步尝试一次重新登录并重试（不阻塞调用者）
      try {
        wx.login({
          success: () => {
            try {
              wx.setStorageSync(key, data)
              console.info('safeSetStorageSync: retry succeeded after wx.login')
            } catch (err2) {
              console.error('safeSetStorageSync: retry failed', err2)
            }
          },
          fail: errLogin => {
            console.error('safeSetStorageSync: wx.login failed', errLogin)
          }
        })
      } catch (err) {
        console.error('safeSetStorageSync: error while attempting wx.login', err)
      }
      return
    }
    throw e
  }
}

function safeGetStorageSync(key) {
  try {
    return wx.getStorageSync(key)
  } catch (e) {
    console.error('safeGetStorageSync failed', e)
    return null
  }
}

module.exports = {
  safeSetStorageSync,
  safeGetStorageSync
}
