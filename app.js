//app.js
App({
  onLaunch: function () {
    var that = this;
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
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
                   that.page = '集团登录',
                   that.jituanuserId = item.data.result_data.UserId
                   that.jituanname = item.data.result_data.StoreName
                   that.globalData.UserName = item.data.result_data.UserName
                   that.globalData.ClassName = item.data.result_data.ClassName
                   that.globalData.UserId = item.data.result_data.UserId
                   resolve()
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