// scan.js
// 移动动画
let animation = wx.createAnimation({});
const app = getApp()
const cwx = require('../../utils/profunc');
// 提示音
// let innerAudioContext = wx.createInnerAudioContext()
// innerAudioContext.src = '/images/beep.mp3'

Page({
  data: {
    scaned: 0,
    active: 0,
    GuestName: '',
    RegisterNo: '',
    timer: null
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
    this.scaned = 0
  },
  onShow(){
    this.donghua()
  },
  donghua(){
    var that = this;
	// 控制向上还是向下移动
    let m = true
    this.setData({
      timer: setInterval(function () {
        if (m) {
          animation.translateY(300).step({ duration: 3000 })
          m = !m;
        } else {
          animation.translateY(0).step({ duration: 3000 })
          m = !m;
        }
  
        that.setData({
          animation: animation.export()
        })
      }.bind(this), 3000)
    })
  },
  changetabs (event) {
    this.setData({
      active: event.detail.index
    })
    // if (event.detail.index === 0) {
    //   this.donghua()
    // } else {
    //   clearInterval(this.data.timer)
    //   this.setData({
    //     timer: null
    //   })
    // }
  },
  cameraError (e) {
  },
  scancode(e){
    let scaned = this.data.scaned;
    if(!scaned){
      this.setData({
        scaned:!0
      },function(){
        let data = e.detail.result
        wx.login({
         success: function(item) {
          wx.request({
            url: 'https://applet.myszgroup.cn:7779/api/UserPage/ScanLogin',
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
                app.page = '单店登录'
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
      })
    }
    // 提示音
    // innerAudioContext.play()
    // 校验扫描结果，并处理
  },
  getModalList () {
    wx.login({
      success: loginres => {
        const params = {
          GuestName: this.data.GuestName,
          RegisterNo: this.data.RegisterNo,
          Model: loginres.code
        }
        wx.request({
          url: 'https://applet.myszgroup.cn:7779/api/UserPage/AppHxLogin',
          method: 'POST',
          header: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          data: params,
          success: function(res) {
            if (res.data.result_code === '0') {
              if (res.data.result_data) {
                wx.showToast({
                  title: '登录成功',
                  icon: 'success',
                  duration: 1000
                })
                app.jituanuserId = res.data.result_data.UserId
                app.jituanname = res.data.result_data.StoreName
                app.globalData.UserName = res.data.result_data.UserName
                app.globalData.UserId = res.data.result_data.UserId
                app.globalData.ClassName = res.data.result_data.ClassName
                app.page = '集团登录'
                wx.navigateTo({
                  url: '/pages/index/index',
                  success: function(data) {
                    // 通过eventChannel向被打开页面传送数据
                    // data.eventChannel.emit('acceptDataFromOpenerPage', { data1: res.data.result_data })
                  }
                })
              }  else {
                wx.showToast({
                  title: res.data.result_msg,
                  icon: 'none',
                })
              }
            }  else {
              wx.showToast({
                title: res.data.result_msg,
                icon: 'none',
              })
            }
          },
          fail: function(erroe){
            wx.showModal({
              content: res.data.result_msg,
              showCancel: false
            })
          }
        })
      }
    })
  },
  onShareAppMessage: function () {
    return {
      title: '北京商周',
      path: 'pages/scan/scan'
    }
  },
  changebase: function(src) {
    
  },
  scanlogin (src) {
    cwx.sacnimg(src).then(res => {
      const string = JSON.parse(res)
      const trdata = JSON.parse(string)
      if (trdata && trdata.errcode === 0) {
        const code = trdata.code_results[0].data
        wx.login({
          success: function(item) {
           wx.request({
             url: 'https://applet.myszgroup.cn:7779/api/UserPage/ScanLogin',
             method: 'POST',
             header: {
               "Content-Type": "application/x-www-form-urlencoded"
             },
             data: {
               scanstr: code,
               code: item.code
             },
             success: function(res) {
               if (res.data.result_code === '0') {
                 app.isshowrole = false
                 app.page = '单店登录'
                 wx.showToast({
                   title: '登录成功',
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
                   title: '登录失败',
                   icon: 'none',
                 })
               }
             },
             fail: function(erroe){
               wx.showToast({
                 title: '登录失败',
                 icon: 'none',
               })
             }
           })
          }
         })
      }
    })
  },
  filelogin () {
    const that = this
    wx.chooseMessageFile({
      count: 1,
      type: "image", //all,video,image,file
      success:(res)=> {
        const filePath = res.tempFiles[0].path
        that.scanlogin(filePath)
      },
    });
  },
  imagelogin () {
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success(res) {
        const filePath = res.tempFiles[0].tempFilePath
        that.scanlogin(filePath)
      }
    })
  }
})