const app = getApp()
const request = require('../../../utils/request')
const config = require('../../../utils/config')
// 防抖函数
function debounce(fn, delay) {
  let timeout = null;
  return function() {
    let self = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function() {
      fn.apply(self, args);
    }, delay);
  };
}

Page({
  data: {
    data: [],
    buttonloading: false,
    formSearch: {
      use_registerno: '',
      use_name: '',
      use_Brand: '',
      use_mobile: ''
    },
    qrcodedata: {},
    rowdata: {},
    buttondisabled: false,
    modalshow: false
  },
  onLoad: function () {
    let that = this;
    let eventChannel = this.getOpenerEventChannel();
    eventChannel.on('acceptDataFromOpenerPage', function (data) {
      that.data.rowdata = data.data1
      that.getList()
    })
  },
  onInput: function(event) {
    this.setData({
      'formSearch.use_registerno': event.detail.value
    });
  },
  onInput1: function(event) {
    this.setData({
      'formSearch.use_Brand': event.detail.value
    });
  },
  onInput2: function(event) {
    this.setData({
      'formSearch.use_name': event.detail.value
    });
  },
  onInput3: function(event) {
    this.setData({
      'formSearch.use_mobile': event.detail.value
    });
  },
  getList: function (e) {
    const that = this
    request.authRequest({
      url: config.API_BASE_URL + '/api/UserPage/GetCouponPresentLog',
      method: 'GET',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {
        'classname': app.globalData.ClassName,
        'cardDetailId': that.data.rowdata.CardIdDetail
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
          that.getbalance()
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
  getbalance: function () {
    const that = this
    request.authRequest({
      url: config.API_BASE_URL + '/api/UserPage/GetCardFavByCardiddetail',
      method: 'GET',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {
        'classname': app.globalData.ClassName,
        'cardidDetail': that.data.rowdata.CardIdDetail,
        'couponPresentLogId': 0,
        'userName': app.globalData.UserName
      },
      success: function (res) {
        if (res.data.result_code === '0') {
          if (res.data.result_data) {
            const carddata = res.data.result_data
            if (Number(carddata.Balance) === Number(that.data.data.length) || Number(carddata.Balance) < Number(that.data.data.length)) {
              that.setData({
                'buttondisabled': true
              })
            } else {
              that.setData({
                'buttondisabled': false
              })
            }
            that.setData({
              'qrcodedata': carddata
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
  delete: function (e) {
    const that = this
    const isnext = e.currentTarget.dataset.isnext
    if (isnext === true) {
      return false
    }
    wx.showModal({
      title: '提示',
      content: '您确定要删除这条数据吗?',
      success(res) {
        if (!res.confirm) {
          return
        }
        request.authRequest({
          url: config.API_BASE_URL + '/api/UserPage/DeleteCouponPresent',
          method: 'GET',
          header: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          data: {
            'classname': app.globalData.ClassName,
            'id': e.currentTarget.dataset.id
          },
          success: function (res) {
            if (res.data.result_code === '0') {
              wx.showModal({
                content: '删除成功',
                showCancel: false,
                success: function () {
                  that.getList()
                }
              })
            } else {
              wx.showModal({
                content: res.data.result_msg,
                showCancel: false
              })
            }
          },
          fail: function () {
            wx.showModal({
              content: '网络请求失败',
              showCancel: false
            })
          }
        })
      }
    })
  },
  openmodal: function () {
    this.setData({
      'formSearch.use_registerno': '',
      'formSearch.use_Brand': '',
      'formSearch.use_name': '',
      'formSearch.use_mobile': '',
      'modalshow': true
    })
  },
  closemodal: function () {
    this.setData({
      'modalshow': false
    })
  },
  save: debounce(function () {
    this.data.buttonloading = true
    const that = this
    request.authRequest({
      url: config.API_BASE_URL + '/api/UserPage/PresentRequired',
      method: 'GET',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {
        'classname': app.globalData.ClassName,
        'cardId': app.globalData.CardId
      },
      success: function (res) {
        if (res.data.result_code === '0') {
          const carddata = res.data.result_data
          const form = that.data.formSearch
          if (carddata.IsRequiredNumber === true && form.use_registerno === '') {
            wx.showModal({
              content: '车牌号不能为空！',
              showCancel: false
            })
            that.data.buttonloading = false
            return false
          }
          if (carddata.IsRequiredBrand === true && form.use_Brand === '') {
            wx.showModal({
              content: '品牌不能为空！',
              showCancel: false
            })
            that.data.buttonloading = false
            return false
          }
          if (carddata.IsRequiredUserName === true && form.use_name === '') {
            wx.showModal({
              content: '使用人姓名不能为空！',
              showCancel: false
            })
            that.data.buttonloading = false
            return false
          }
          if (carddata.IsRequiredMobile === true && form.use_mobile === '') {
            wx.showModal({
              content: '使用人联系电话不能为空！',
              showCancel: false
            })
            that.data.buttonloading = false
            return false
          }
          that.Commit()
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
  }, 1000),
  Commit: function () {
    this.data.buttonloading = true
    const that = this
    request.authRequest({
      url: config.API_BASE_URL + '/api/UserPage/CommitUsedInfo',
      method: 'POST',
      header: {
        'content-type': 'application/json', // 设置请求的 header
      },
      data: {
        ...that.data.formSearch,
        'classname': app.globalData.ClassName,
        'CardId_Detail': that.data.rowdata.CardIdDetail,
        'isPresented': null
      },
      success: function (res) {
        that.data.buttonloading = false
        if (res.data.result_code === '0') {
          wx.showModal({
            content: '新增成功！',
            showCancel: false,
            success: function() {
              that.getList()
              that.setData({
                'modalshow': false
              })
            }
          })
        } else {
          wx.showModal({
            content: res.data.result_msg,
            showCancel: false
          })
        }
      },
      fail: function (erroe) {
        that.data.buttonloading = false
        wx.showModal({
          content: res.data.result_msg,
          showCancel: false
        })
      }
    })
  },
  tourl:function(e) {
    const newdata = this.data.data[e.currentTarget.dataset.number]
    wx.navigateTo({
      url: '/pages/qrcode/qrcode',
      success: function(data) {
        // 通过eventChannel向被打开页面传送数据
        data.eventChannel.emit('acceptDataFromOpenerPage', { data1: newdata, Page: '生成核销二维码' })
      }
    })
  },
})