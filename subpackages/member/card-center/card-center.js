const app = getApp()

Page({
  data: {
    cardlist: []
  },
  onLoad: function() {
    this.getList()
  },
  openremark: function(e) {
    const number = e.target.dataset.number
    const data = this.data.cardlist
    data[number].fold = !data[number].fold
    this.setData({
      'cardlist': data
    })
  },
  tourl:function(e) {
    const newdata = this.data.cardlist[e.currentTarget.dataset.number]
    wx.navigateTo({
      url: e.currentTarget.dataset.url,
      success: function(data) {
        // 通过eventChannel向被打开页面传送数据
        data.eventChannel.emit('acceptDataFromOpenerPage', { data1: newdata, Page: '二维码图标' })
      }
    })
  },
  openhistory: function() {
    wx.navigateTo({
      url: '/subpackages/transfer/transferHistory/transferHistory',
      success: function(data) {
        // 通过eventChannel向被打开页面传送数据
        data.eventChannel.emit('acceptDataFromOpenerPage', {})
      }
    })
  },
  getList: function(e) {
    const that = this
    wx.request({
      url: 'https://applet.myszgroup.cn:7779/api/UserPage/GetVouchersList',
      method: 'GET',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {
        'classname': app.globalData.ClassName,
        'cardId': app.globalData.CardId
      },
      success: function(res) {
        if (res.data.result_code === '0') {
          if (res.data.result_data && res.data.result_data.length > 0) {
            const carddata = res.data.result_data
            for (var i = 1, n = carddata.length; i < n; i++) {
              carddata[i].fold = false
              if (carddata[i].Enddate === null) {
                carddata[i].Enddate = '长期'
              }
          }
            that.setData({
              'cardlist': res.data.result_data
            })
          } else {
            wx.showModal({
              content: '暂无数据',
              showCancel: false
            })
          }
        } else {
          wx.showModal({
            content: res.data.result_msg,
            showCancel: false
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