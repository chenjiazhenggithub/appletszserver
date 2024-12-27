const app = getApp()
const moment = require('moment')
const qrCode = require('../../utils/weapp.qrcode.min');

Page({
  data: {
    rowdata: {},
    data: {},
    text: '',
    cardidDetail: '',
    couponPresentLogId: null,
    isshow: false,
    fold: false
  },
  onLoad: function () {
    let that = this;
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
    wx.request({
      url: 'https://applet.myszgroup.cn:7779/api/UserPage/GetCardFavByCardiddetail',
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
            if (carddata.EndDate !== '无期限'){
              const diffdata = moment().format('YYYY-MM-DD')
              const diffdata1 = moment(carddata.EndDate).format('YYYY-MM-DD')
              if (moment(diffdata).isBefore(diffdata1) !== true) {
                that.setData({
                  'isshow': true
                })
              }
            }
            const codecontent = carddata.CouponNumber + '***'
            if (codecontent !== "该优惠券 已失效***") {
              qrCode({
                width: 139, // 图片宽度
                height: 139, // 图片高度
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