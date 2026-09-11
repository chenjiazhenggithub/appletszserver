const app = getApp()
const moment = require('moment')
const qrCode = require('../../utils/weapp.qrcode.min');
const request = require('../../utils/request');

Page({
  data: {
    rowdata: {},
    data: {},
    text: '',
    cardidDetail: '',
    couponPresentLogId: null,
    isshow: false,
    fold: false,
    qrSize: 125
  },
  onLoad: function () {
    let that = this;
    // 边框 345rpx，两侧各留 20rpx 内边距，二维码填满四角内区域
    const windowWidth = wx.getSystemInfoSync().windowWidth
    this.setData({
      qrSize: Math.floor(windowWidth * 305 / 750)
    })
    let eventChannel = this.getOpenerEventChannel();
    eventChannel.on('acceptDataFromOpenerPage', function (data) {
      if (data.Page === '二维码图标') {
        that.data.rowdata = data.data1
        that.data.couponPresentLogId = 0
        that.data.cardidDetail = data.data1.CardIdDetail
        that.getList()
      }
      if (data.Page === '生成核销二维码') {
        that.data.rowdata = data.data1
        that.data.couponPresentLogId = data.data1.Id
        that.data.cardidDetail = data.data1.CardDetailId
        that.getList()
      }
      if (data.Page === '待核销页面') {
        that.data.rowdata = data.data1
        that.data.couponPresentLogId = data.data1.Id
        that.data.cardidDetail = data.data1.CardDetailId
        that.getList()
      }
    })
  },
  getList: function (e) {
    const that = this
    request.authRequest({
      url: 'http://localhost:44705/api/UserPage/GetCardFavByCardiddetail',
      method: 'GET',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {
        'classname': app.globalData.ClassName,
        'cardidDetail': that.data.cardidDetail,
        'couponPresentLogId': that.data.couponPresentLogId,
        'userName': app.globalData.UserName,
      },
      success: function (res) {
        if (res.data.result_code === '0') {
          if (res.data.result_data) {
            const carddata = res.data.result_data
            let time = 240
            if (carddata.IsPresented === true && carddata.InvalidMin !== 0) {
              time = carddata.InvalidMin
            }
            // EndDate 为空或“无期限”视为永久有效，不盖章；仅到期日早于今天才显示已过期
            if (carddata.EndDate && carddata.EndDate !== '无期限') {
              const today = moment().format('YYYY-MM-DD')
              const enddate = moment(carddata.EndDate).format('YYYY-MM-DD')
              if (moment(enddate).isBefore(today)) {
                that.setData({
                  'isshow': true
                })
              }
            }
            const codecontent = carddata.CouponNumber + '***'
            if (codecontent !== "该优惠券 已失效***") {
              qrCode({
                width: that.data.qrSize, // 图片宽度，与 canvas 实际像素一致
                height: that.data.qrSize, // 图片高度，与 canvas 实际像素一致
                canvasId: 'qrTarget', // <canvas>标签中的canvas-id值
                text: codecontent, //图片中的内容，根据自己的需求进行设置设置
              })
            }
            const text = '请在' + moment().add(time, 'm').format('YYYY-MM-DD HH:mm') + '前使用超时请重新生成核销二维码'
            that.setData({
              'data': carddata,
              'text': text
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
  opendescription: function () {
    this.setData({
      'fold': !this.data.fold
    })
  }
})