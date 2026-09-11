// scan.js
// 移动动画
let animation = wx.createAnimation({});
const app = getApp()
const request = require('../../utils/request');
// 提示音
// let innerAudioContext = wx.createInnerAudioContext()
// innerAudioContext.src = '/images/beep.mp3'

Page({
  data: {
  },
  onLoad: function () {
    // var that = this
    // const eventChannel = this.getOpenerEventChannel()
    // eventChannel.on('acceptDataFromOpenerPage', function(data) {
    //   that.setData({
    //     code: data.data1.code
    //   })
    // })
  },
  onHide: function() {
  },
  onShow(){
    this.donghua()
  },
  donghua(){
    var that = this;
	// 控制向上还是向下移动
    let m = true
	
    setInterval(function () {
      if (m) {
        animation.translateY(250).step({ duration: 3000 })
        m = !m;
      } else {
        animation.translateY(-10).step({ duration: 3000 })
        m = !m;
      }

      that.setData({
        animation: animation.export()
      })
    }.bind(this), 3000)
  },
  scancode(e){
    let data = e.detail.result
    wx.login({
     success: function(item) {
      request.authRequest({
        url: 'http://localhost:44705/api/UserPage/ScanLogin',
        method: 'POST',
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        data: {
          scanstr: data,
          code: item.code
        },
        success: function(res) {
          if (res.data.result_code === '0') {
            app.isshowrole = false
            wx.showToast({
              title: '扫码登录成功',
              icon: 'success',
              duration: 1000
            })
            wx.navigateTo({
              url: '/pages/index/index',
              success: function(data) {
                // 通过eventChannel向被打开页面传送数据
                data.eventChannel.emit('acceptDataFromOpenerPage', { data1: res.data.result_data })
              }
            })
          } else {
            wx.showToast({
              title: '扫码登录失败',
              icon: 'none',
            })
          }
        },
        fail: function(erroe){
          wx.showToast({
            title: '扫码登录失败',
            icon: 'none',
          })
        }
      })
     }
    })
  }
})