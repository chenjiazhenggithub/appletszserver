const app = getApp()
Page({
  data: {
    Password: '',
    oldvalue: '',
    newvalue: ''
  },
  oninput(e) {
    this.setData({
      oldvalue: e.detail.value
    })
  },
  oninput1(e) {
    this.setData({
      newvalue: e.detail.value
    })
  },
  oninput2(e) {
    this.setData({
      Password: e.detail.value
    })
  },
  savepassword() {
    const that = this
    console.log(this.data.Password)
    if (this.data.Password !== this.data.newvalue) {
      wx.showModal({
        title: '提示',
        content: '确认密码和新密码不一致，请重新输入。',
      })
    }
    wx.request({
      url: 'https://applet.myszgroup.cn:7779/api/UserPage/UpdateGroupPwd',
      method: 'POST',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {
        'Classname': app.globalData.ClassName,
        'UserId': app.globalData.UserId,
        'OldPassword': this.data.oldvalue,
        'NewPassword': this.data.Password
      },
      success: function(res) {
        if (res.data.result_code === '0') {
          wx.showToast({
            title: '修改成功',
            icon: 'success',
            duration: 1000,
            success: function() {
              that.cancellation()
            }
          })
        } else {
          wx.showToast({
            title: res.data.result_msg,
            icon: 'none',
          })
        }
      },
      fail: function(erroe){
        wx.showToast({
          title: res.data.result_msg,
          icon: 'none',
        })
      }
    })
  },
  cancellation: function(e) {
    wx.login({
      success: item => {
        let url = ''
        let params = {}
        params.Model = item.code
        url = 'https://applet.myszgroup.cn:7779/api/UserPage/AppHxLogOut'
        wx.request({
          url: url,
          method: 'POST',
          header: {
            'content-type': 'application/json' 
          },
          data: params,
          success: function(res) {
            if (res.data.result_code === '0') {
              wx.navigateTo({
                url: '/pages/scan/scan',
                success: function(data) {
                  // 通过eventChannel向被打开页面传送数据
                  // data.eventChannel.emit('acceptDataFromOpenerPage', { data1: res.data.result_data })
                }
              })
            } else {
              wx.showToast({
                title: '退出登录失败',
                icon: 'none',
              })
            }
          },
          fail: function(erroe){
            wx.showToast({
              title: '退出登录失败',
              icon: 'none',
            })
          }
        })
      }
    })
  }
})