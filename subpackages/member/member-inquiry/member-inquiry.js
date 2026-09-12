
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
    option1: [
      { text: '车牌号', value: '1' },
      { text: '车架号', value: '2' }
      // { text: '手机号', value: '3' },
      // { text: '客户姓名', value: '4' },
    ],
    list: [],
    BaseData: {},
    diyongquanData: [],
    chuzhiData: [],
    FujiaxinxiData: [],
    chuzhitotal: null,
    show: false,
    custormshow: true,
    chuzhishow: true,
    RegisterNo: '',
    active: 0,
    checked: false,
    CardId: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.cleardata()
    this.setData({
      'RegisterNo': '',
      'SfCardId': '1'
    })
  },
  changelist: function(event) {
    const data = event.currentTarget.dataset
    const arr = this.data.list
    arr.forEach((item, index) => {
      item.color = '#dddddd'
      item.class = ''
      arr[data.index].color = '#c0a474'
      arr[data.index].class = 'border-active'
    })
    this.setData({
      list: arr,
      CardId: data.item.CardId
    })
  },
  getList: function(e) {
    const that = this
    let carnumber = ''
    if (this.data.SfCardId === '1') {
      if (this.data.RegisterNo !== '') {
        carnumber = this.data.RegisterNo.replace(/\s/g,"").replace(/[^A-Za-z0-9\u4e00-\u9fa5]/g, '')
      }
      if (carnumber.length < 5) {
        wx.showModal({
          content: '车牌号不能少于5位',
          showCancel: false
        })
      } else {
        const params = {
          classname: app.globalData.ClassName,
          RegisterNo: carnumber,
          SfCardId: this.data.SfCardId,
          OpUser: app.globalData.UserNo
        }
        that.getdata(params)
      }
    } else {
      if (this.data.RegisterNo !== '') {
        carnumber = this.data.RegisterNo
      }
      if (carnumber.length < 6) {
        wx.showModal({
          content: '车架号不能少于6位',
          showCancel: false
        })
      } else {
        const params = {
          classname: app.globalData.ClassName,
          RegisterNo: carnumber,
          SfCardId: this.data.SfCardId,
          OpUser: app.globalData.UserNo
        }
        that.getdata(params)
      }
    }
  },
  getdata(params) {
    const that = this
    request.authRequest({
      url: config.API_BASE_URL + '/api/UserPage/VehicleDataSeach',
      method: 'POST',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: params,
      success: function(res) {
        if (res.data.result_code === '0') {
          if (res.data.result_data && res.data.result_data.length > 1) {
            const arr = res.data.result_data
            arr.forEach(item => {
              item.color = '#dddddd'
              item.class = ''
            })
            that.setData({
              list: arr,
              show: true
            })
          } else if (res.data.result_data && res.data.result_data.length === 1) {
            that.setData({
              CardId: res.data.result_data[0].CardId
            })
            that.getModalList()
          } else {
            wx.showModal({
              content: '无此会员信息',
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
      show: false,
      BaseData: {},
      diyongquanData: [],
      chuzhiData: [],
      FujiaxinxiData: [],
      chuzhitotal: null,
      custormshow: true,
      chuzhishow: true
    })
  },
  getModalList: function (e) {
    this.cleardata()
    const that = this
    const params = {
      classname: app.globalData.ClassName,
      CardId: this.data.CardId
    }
    request.authRequest({
      url: config.API_BASE_URL + '/api/UserPage/VehicleDataSeachByID',
      method: 'POST',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: params,
      success: function(res) {
        if (res.data.result_code === '0') {
          if (res.data.result_data) {
            const jiekoudata = res.data.result_data
            const arr = jiekoudata.diyongquanData
            const arr1 = jiekoudata.chuzhiData
            const arr3 = jiekoudata.FujiaxinxiData
            let money = null
            arr.forEach(item => {
              item.Startdate = item.Startdate && util.formatTime(new Date(item.Startdate))
              item.enddate = item.enddate && util.formatTime(new Date(item.enddate))
            })
            arr1.forEach(item => {
              item.Startdate = item.Startdate && util.formatTime(new Date(item.Startdate))
              item.enddate = item.enddate && util.formatTime(new Date(item.enddate))
              money += item.balance
            })
            if ((arr1 && arr1.length === 0) && (arr && arr.length === 0) ) {
              that.setData({
                chuzhishow: true,
              })
            } else {
              that.setData({
                chuzhishow: false,
              })
            }
            let custorobject = {}
            if (jiekoudata.BaseData && jiekoudata.BaseData.length > 0) {
              custorobject = jiekoudata.BaseData[0]
            } else {
              custorobject = {}
            }
            if (custorobject.SellCardDate && custorobject.SellCardDate !== '') {
              custorobject.SellCardDate = custorobject.SellCardDate && util.formatTime1(new Date(custorobject.SellCardDate))
            } else {
              custorobject.SellCardDate = ''
            }
            if (custorobject.LastInTime) {
              custorobject.LastInTime = custorobject.LastInTime && util.formatTime1(new Date(custorobject.LastInTime))
            } else {
              custorobject.LastInTime = ''
            }
            if (custorobject.a_enddate_1) {
              custorobject.a_enddate_1 = custorobject.a_enddate_1 && util.formatTime1(new Date(custorobject.a_enddate_1))
            } else {
              custorobject.a_enddate_1 = ''
            }
            if (custorobject.state === '0' && custorobject.cardstopflag === false &&custorobject.gueststopflag === false) {
             
            } else {
              wx.showModal({
                content: '该会员已过期或停用',
                showCancel: false
              })
            }
            that.setData({
              show: false,
              BaseData: jiekoudata.BaseData[0],
              diyongquanData: arr,
              chuzhiData: arr1,
              FujiaxinxiData: arr3,
              chuzhitotal: money,
              custormshow: false
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
          content: erroe.data.result_msg,
          showCancel: false
        })
      }
    })
  },
  onClose() {
    this.setData({ show: false });
  },
  tourl: function(e) {
    const item = this.data.diyongquanData[e.currentTarget.dataset.number]
    console.log('优惠项目行数据：', item)
    // VehicleDataSeachByID 返回的字段名与待核销列表接口不一致，做兼容映射
    const newdata = {
      ...item,
      Id: item.Id || 0,
      CardDetailId: item.CardDetailId || item.CardIdDetail || item.CardId_Detail || item.cardid_detail || item.cardidDetail || ''
    }
    if (!newdata.CardDetailId) {
      wx.showModal({
        content: '该优惠项目缺少券明细标识，无法生成二维码',
        showCancel: false
      })
      return
    }
    wx.navigateTo({
      url: e.currentTarget.dataset.url,
      success: function(data) {
        // 通过eventChannel向被打开页面传送数据
        data.eventChannel.emit('acceptDataFromOpenerPage', { data1: newdata, Page: '待核销页面' })
      }
    })
  },
  // copy (e) {
  //   const that = this
  //   wx.setClipboardData({
  //     data: that.data.BaseData.RegisterNo,
  //     success: function (res) {
  //       wx.showToast({
  //         title: '复制成功',
  //       })
  //     }
  //   })
  // },
  clickPhone () {
    wx.makePhoneCall({
      phoneNumber: this.data.BaseData.Mobile,
      success: function() {

      },
      fail: function () {
        wx.showToast({
          title: '拨号失败'
        })
      }
    })
  },
  onChangedropdown (value) {
    this.setData({
      'SfCardId': value.detail
    })
  },
  onChangefield (value) {
    this.setData({
      'RegisterNo': value.detail
    })
  }
})