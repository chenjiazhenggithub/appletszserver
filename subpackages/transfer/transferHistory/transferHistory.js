const app = getApp()
const request = require('../../../utils/request')
Page({
  data: {
    number: '',
    value1: 0,
    option1: [
      { text: '车牌号', value: 0 },
    ],
  },
  onLoad: function () {
    this.getList()
  },
  onPullDownRefresh() {
    this.getList()
  },
  oninput(e) {
    this.setData({
      'number': e.detail
    })
  },
  clear () {
    this.setData({
      'number': ''
    })
    this.getList()
  },
  getList: function (e) {
    this.setData({
      'data': []
    })
    const that = this
    request.authRequest({
      url: 'http://localhost:44705/api/UserPage/GetCouponPresentHistory',
      method: 'GET',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {
        'classname': app.globalData.ClassName,
        'cardId': app.globalData.CardId,
        'pageIndex': 1,
        'pageSize': 100000,
        'number': that.data.number
      },
      success: function (res) {
        if (res.data.result_code === '0') {
          if (res.data.result_data) {
            const carddata = res.data.result_data
            that.setData({
              'data': carddata
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
      fail: function (erroe) {
        wx.showModal({
          content: res.data.result_msg,
          showCancel: false
        })
      }
    })
  },
})