const app = getApp()
const request = require('../../../utils/request')
const config = require('../../../utils/config')
Page({
  data: {
    useRegisterno: '',
    value1: 0,
    data: [],
    option1: [
      { text: '使用车牌号', value: 0 },
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
      'useRegisterno': e.detail
    })
  },
  clear () {
    this.setData({
      'useRegisterno': ''
    })
    this.getList()
  },
  tourl:function(e) {
    const newdata = this.data.data[e.currentTarget.dataset.number]
    wx.navigateTo({
      url: e.currentTarget.dataset.url,
      success: function(data) {
        // 通过eventChannel向被打开页面传送数据
        data.eventChannel.emit('acceptDataFromOpenerPage', { data1: newdata, Page: '待核销页面' })
      }
    })
  },
  getList: function (e) {
    this.setData({
      'data': []
    })
    const that = this
    request.authRequest({
      url: config.API_BASE_URL + '/api/UserPage/GetUnVerificationList',
      method: 'GET',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {
        'classname': app.globalData.ClassName,
        'useRegisterno': that.data.useRegisterno
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