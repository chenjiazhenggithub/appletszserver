//app.js
App({
  onLaunch: function () {
    var that = this;
    const safeStorage = require('./utils/safeStorage')
    // Wrap wx.setStorageSync to handle cases where the underlying app-service
    // may fail due to an expired access_token (INVALID_LOGIN). This makes
    // setStorageSync resilient: on such error we attempt a wx.login and retry once.
    try {
      if (wx && wx.setStorageSync && !wx.__safeSetStorageSyncWrapped) {
        const _origSetStorageSync = wx.setStorageSync.bind(wx)
        wx.setStorageSync = function(key, data) {
          try {
            return _origSetStorageSync(key, data)
          } catch (e) {
            // Normalize message
            const msg = (e && (e.errMsg || e.message)) ? (e.errMsg || e.message) : String(e)
            console.error('setStorageSync failed:', msg, e)
            if (msg.indexOf('INVALID_LOGIN') !== -1 || msg.indexOf('access_token expired') !== -1) {
              // Try to refresh login and retry once (best-effort).
              try {
                wx.login({
                  success: res => {
                    try {
                      _origSetStorageSync(key, data)
                      console.info('setStorageSync retry succeeded after wx.login')
                    } catch (err2) {
                      console.error('Retry setStorageSync still failed', err2)
                    }
                  },
                  fail: errLogin => {
                    console.error('wx.login failed while handling setStorageSync INVALID_LOGIN', errLogin)
                  }
                })
              } catch (err) {
                console.error('Error while attempting wx.login for setStorageSync recovery', err)
              }
              // Return undefined since original call failed; recovery happens asynchronously
              return
            }
            // rethrow if not handled
            throw e
          }
        }
        wx.__safeSetStorageSyncWrapped = true
      }
    } catch (wrapErr) {
      // Defensive: ensure onLaunch doesn't crash due to wrapper logic
      console.error('Failed to install safe setStorageSync wrapper', wrapErr)
    }
    // 展示本地存储能力
    var logs = (safeStorage.safeGetStorageSync('logs')) || []
    logs.unshift(Date.now())
    try {
      safeStorage.safeSetStorageSync('logs', logs)
    } catch (e) {
      console.error('Failed to write logs to storage onLaunch', e)
    }
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  onError(err) {
    // 全局错误处理，捕获运行时未处理异常并记录到本地日志，便于排查
    try {
      const safeStorage = require('./utils/safeStorage')
      const now = new Date().toISOString()
      const entry = {
        time: now,
        error: (err && (err.message || err.errMsg)) ? (err.message || err.errMsg) : String(err),
        stack: err && err.stack ? err.stack : null
      }
      // 读取旧日志并追加（保持小型）
      const logs = safeStorage.safeGetStorageSync('error_logs') || []
      logs.unshift(entry)
      // 限制日志长度
      if (logs.length > 50) logs.splice(50)
      safeStorage.safeSetStorageSync('error_logs', logs)
      console.error('Global onError captured:', entry)
      // 当开发者工具出现关键错误时，尽量提示
      try { wx.showToast({ title: '发生运行时错误（查看控制台）', icon: 'none', duration: 3000 }) } catch (e) {}
    } catch (e) {
      console.error('onError handler failed', e)
    }
  },
  // onShow: function () {
  //   if (this.page === '集团登录') {
  //     this.neelogon()
  //   }
  // },
  neelogon: function () {
    var that = this
    // 登录
    return new Promise((resolve, reject) => {
      wx.login({
        success: res => {
          wx.request({
            url: 'https://applet.myszgroup.cn:7779/api/UserPage/AppHxIsLogInOrNot',
            method: 'POST',
            header: {
              'content-type': 'application/json' 
            },
            data: {
              'Model': res.code
            },
            success: function(item) {
             //  this.navTo = true
              if (item.data.result_code !== '0') {
               wx.showModal({
                 content: item.data.result_msg,
                 showCancel: false
               })
               resolve()
               // wx.navigateTo({
               //   url: '/pages/scan/scan',
               //   success: function(data) {
               //     // 通过eventChannel向被打开页面传送数据
               //     data.eventChannel.emit('acceptDataFromOpenerPage', { data1: res })
               //   }
               // })
              } else {
                if (JSON.stringify(item.data.result_data) === '{}' || item.data.result_data === null) {
                 that.logon().then(res => {
                  resolve()
                 })
                } else {
                  if (item.data.result_data.IsDelete === true) {
                    that.logon().then(res => {
                      resolve()
                     })
                  } else {
                    that.page = '集团登录',
                    that.jituanuserId = item.data.result_data.UserId
                    that.jituanname = item.data.result_data.StoreName
                    that.globalData.UserName = item.data.result_data.UserName
                    that.globalData.ClassName = item.data.result_data.ClassName
                    that.globalData.UserId = item.data.result_data.UserId
                    resolve()
                  }
                }
              }
              if (that.userJituannameCallback) {
               that.userJituannameCallback(item, '')
             }
            },
            fail: function(error) {
             wx.showModal({
               content: error.data.result_msg,
               showCancel: false
             })
             resolve()
            }
          })
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
        }
      })
    })
  },
  logon: function () {
    var that = this
    // 登录
    return new Promise((resolve, reject) => {
      wx.login({
        success: res => {
          wx.request({
            url: 'https://applet.myszgroup.cn:7779/api/UserPage/GetLoginStatus',
            method: 'GET',
            header: {
              'content-type': 'application/json' 
            },
            data: {
              'code': res.code
            },
            success: function(item) {
             //  this.navTo = true
              if (item.data.result_code !== '0') {
                 wx.navigateTo({
                   url: '/pages/scan/scan',
                   success: function(data) {
                     // 通过eventChannel向被打开页面传送数据
                     data.eventChannel.emit('acceptDataFromOpenerPage', { data1: res })
                   }
                 })
              } else {
                that.isfirst = false
                that.page = '单店登录'
                that.globalData.CardId = item.data.result_data.CardId
                that.globalData.storename = item.data.result_data.StoreName
                that.globalData.UserName = item.data.result_data.UserName
                that.globalData.ClassName = item.data.result_data.ClassName
                that.globalData.UserId = item.data.result_data.UserId
                that.globalData.StoreId = item.data.result_data.StoreId
                that.globalData.UserNo = item.data.result_data.UserNo
                that.globalData.powerModel = item.data.result_data.powerModel
              }
              if (that.userStorenameCallback) {
                that.userStorenameCallback(item)
              }
              resolve()
            },
            fail: function(error) {
              resolve()
            }
          })
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
        }
      })
    })
  },
  globalData: {
    userInfo: null,
    storename: '',
    UserName: '',
    ClassName: '',
    UserId: null,
    StoreId: '',
    UserNo: '',
    powerModel: [],
    CardId: ''
  },
  isfirst: true,
  isshowrole: true,
  page: '',
  jituanuserId: null,
  jituanname: ''
})