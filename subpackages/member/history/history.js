
const app = getApp()
const util  = require('../../../utils/util.js')
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
    wx.request({
      url: 'https://szg.bjcls.cn:9330/api/SZGroupReport/GroupHxDetail',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        'startDate': this.data.startDate,
        'endDate': this.data.endDate,
        'typeId': 52,
        'storeId': '',
        'department': '',
        'ServiceGroupId': 0,
        'orderNumber': this.data.carNo,
        'GroupId': app.globalData.ServiceGroupId,
        'SettlementStatus': null,
        'favorableIds': [],
        'userId': app.globalData.UserId,
        'pageIndex': 1,
        'pageSize': 200
      },
      success: function(res) {
        if (res.statusCode === 200 && res.data && res.data.data) {
          var rows = res.data.data.rows || []
          if (rows.length > 0) {
            var historydata = rows.map(function(item) {
              return {
                scanstr: item['核销项目'] || '',
                cname: item['客户姓名'] || '',
                CarNo: item['使用车牌号'] || '',
                UseBrand: item['使用品牌'] || '',
                bICouponTypeName: item['核销日期'] || ''
              }
            })
            that.setData({ 'historydata': historydata })
          } else {
            wx.showModal({ content: '暂无数据', showCancel: false })
            that.cleardata()
          }
        } else {
          wx.showModal({ content: '请求失败', showCancel: false })
          that.cleardata()
        }
      },
      fail: function(error) {
        wx.showModal({ content: '网络请求失败', showCancel: false })
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