//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    motto: '我的权限',
    userInfo: {},
    menulist: [
      {
        towmenu: [
          {
            title: '客户办卡',
            iamge: './images/客户办卡.png',
            src: '/pages/customer-card/customer-card',
            index: 1
          },{
            title: '消费结账',
            iamge: './images/消费结账.png',
            index: 2
          }
        ]
      }
    ],
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  getScancode: function() {
    wx.scanCode({
      success: function(res) {
        console.log(res)
      }
    })
  },
  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  logBtn: function(e) {
    console.log(e.currentTarget.dataset.src)
    wx.navigateTo({
      url: e.currentTarget.dataset.src,
    })
  }
})
