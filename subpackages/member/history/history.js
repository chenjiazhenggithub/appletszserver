
const app = getApp()
const util  = require('../../../utils/util.js')
const request = require('../../../utils/request')
const config = require('../../../utils/config')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    SfCardId: '1',
    SfCardId1: '2',
    timefocus: false,
    startDate: '',
    endDate: '',
    minDate: new Date(2020, 12, 1).getTime(),
    maxDate: new Date().getTime(),
    option1: [
      { text: '使用车牌号', value: '1' },
      // { text: '手机号', value: '3' },
      // { text: '客户姓名', value: '4' },
    ],
    option2: [
      { text: '日期', value: '2' },
      // { text: '手机号', value: '3' },
      // { text: '客户姓名', value: '4' },
    ],
    historydata: [],
    carNo: '',
    timevalue: '',
    timeshow: false,
    active: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.cleardata()
    this.setData({
      'carNo': '',
      'SfCardId': '1',
      'startDate': this.formatDate(new Date()),
      'endDate': this.formatDate(new Date()),
      'timevalue': `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()} - ${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`
    })
  },
  onConfirm:function (event) {
    const [start, end] = event.detail;
    this.setData({
      timeshow: false,
      startDate: this.formatDate(start),
      endDate: this.formatDate(end),
      timevalue: `${this.formatDate(start)} - ${this.formatDate(end)}`,
    });
  },
  formatDate(date) {
    date = new Date(date);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  },
  getList: function(e) {
    const that = this
    request.authRequest({
      url: config.API_BASE_URL + '/api/UserPage/SearchHxHistory',
      method: 'GET',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {
        'classname': '',
        'userId': app.globalData.UserId,
        'startDate': this.data.startDate,
        'endDate': this.data.endDate,
        'carNo': this.data.carNo
      },
      success: function(res) {
        if (res.data.result_code === '0') {
          if (res.data.result_data && res.data.result_data.length > 0) {
            that.setData({
              'historydata': res.data.result_data
            })
          } else {
            wx.showModal({
              content: '暂无数据',
              showCancel: false
            })
            that.cleardata()
          }
        } else {
          wx.showModal({
            content: res.data.result_msg,
            showCancel: false
          })
          that.cleardata()
        }
      },
      fail: function(erroe){
        wx.showModal({
          content: res.data.result_msg,
          showCancel: false
        })
      }
    })
  },
  cleardata: function () {
    this.setData({
      'carNo': '',
      'SfCardId': '1',
      'historydata': [],
      // 'timevalue': `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()} - ${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`,
      // 'startDate': this.formatDate(new Date()),
      // 'endDate': this.formatDate(new Date())
    })
  },
  onClose() {
    this.setData({ timeshow: false });
  },
  onChangefield (value) {
    this.setData({timefocus: false})
    this.setData({ timeshow: true });
  },
  onChangefield1(value) {
    this.setData({
      'carNo': value.detail
    })
  }
})