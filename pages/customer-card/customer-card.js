// pages/customer-card/customer-card.js
import WxValidate from '../../utils/WxValidate.js'
const cwx = require('../../utils/profunc.js');
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    form: {
      GuestName: '',
      Mobile: '',
      SfCardId: '',
      RegisterNo: '',
      Vin: '',
      Brand: '',
      Series: '',
      Model: '',
      BuyDate: '',
      BxEndDate: '',
      Department: '',
      ModelName: ''
    },
    ClassName: '',
    StoreId: '',
    UserNo: '',
    BrandList: [],
    SeriesList: [],
    ModelList: [],
    SeriesList1: [],
    ModelList1: [],
    DictionaryList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getlist()
    const that = this
    const eventChannel = this.getOpenerEventChannel()
    if (JSON.stringify(eventChannel) === '{}') {
    } else {
      eventChannel.on('acceptDataFromOpenerPage', function(data) {
        that.ClassName = data.data1.ClassName
        that.StoreId = data.data1.StoreId
        that.UserNo = data.data1.UserNo
      })
    }
    this.initValidate()
    rules: {}
    messages: {}
  },
  bindTimeChange: function(e) {
    this.setData({
      'form.BuyDate': e.detail.value
    })
  },
  bindTimeChange1: function(e) {
    this.setData({
      'form.BxEndDate': e.detail.value
    })
  },
  bindPickerChange: function (e) {
    const filterBrandId = this.data.BrandList[e.detail.value].BrandId
    const arr = this.data.SeriesList1.filter(v => v.BrandId === filterBrandId)
    this.setData({
      'form.Brand': this.data.BrandList[e.detail.value].BrandName,
      'SeriesList': arr
    })
  },
  bindPickerChange1: function (e) {
    if (this.data.SeriesList && this.data.SeriesList.length !== 0) {
      const filterSeriesId = this.data.SeriesList[e.detail.value].SeriesId
      const arr = this.data.ModelList1.filter(v => v.SeriesId === filterSeriesId)
      this.setData({
        'form.Series': this.data.SeriesList[e.detail.value].SeriesName,
        'ModelList': arr
      })
    }
  },
  bindPickerChange2: function (e) {
    if (this.data.ModelList && this.data.ModelList.length !== 0) {
      this.setData({
        'form.Model': this.data.ModelList[e.detail.value].ModelName
      })
    }
  },
  bindPickerChange3: function (e) {
    this.setData({
      'form.Department': this.data.DictionaryList[e.detail.value].Name
    })
  },
  bindPickerClone: function (e) {
    this.setData({
      'form.Brand': ''
    })
  },
  bindPickerClone1: function (e) {
    this.setData({
      'form.Model': ''
    })
  },
  bindPickerClone2: function (e) {
    this.setData({
      'form.BuyDate': ''
    })
  },
  bindPickerClone3: function (e) {
    this.setData({
      'form.BxEndDate': ''
    })
  },
  showModal(error) {
    wx.showModal({
      content: error.msg,
      showCancel: false,
    })
  },
  changephone(){
    var that = this;
    cwx.OcrIdCard(that.data.access_token).then(function(_res){
      const string = JSON.parse(_res)
      const trdata = JSON.parse(string)
      if (trdata.errcode === 0) {
        if (trdata.owner) {
          that.setData({
            'form.GuestName': trdata.owner,
            'form.RegisterNo': trdata.plate_num,
            'form.Vin': trdata.vin,
            'form.Address': trdata.addr
          })
        } else {
         
        }
      } else {
        wx.showToast({
          title: trdata.errmsg,
        })
      }
  })
},
  //验证函数
  initValidate() {
    const rules = {
      GuestName: {
        required: true,
        minlength:2
      },
      Mobile: {
        required:true,
        tel:true
      },
      RegisterNo: {
        required: true
      },
      Vin: {
        required: true,
        numberlength:17
      },
      Series: {
        required: true
      },
      SfCardId: {
        idcard: true
      },
      Department: {
        required: true
      }
    }
    const messages = {
      GuestName: {
        required: '请填写客户姓名',
        minlength:'请输入正确的名称'
      },
      Mobile:{
        required:'请填写手机号',
        tel:'请填写正确的手机号'
      },
      RegisterNo:{
        required:'请填写车牌号'
      },
      Vin:{
        required:'请填写车架号',
        numberlength: '请输入17位有效车架号'
      },
      Series:{
        required:'请填写车系'
      },
      Department:{
        required:'请填写部门'
      }
    }
    this.WxValidate = new WxValidate(rules, messages)
  },
  getlist: function(e) {
    var that = this
    wx.request({
      url: 'https://applet.myszgroup.cn:7779/api/UserPage/VehicleData',
      method: 'POST',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {
        'code': app.globalData.ClassName,
        'scanstr': app.globalData.StoreId
      },
      success: function(res) {
        if (res.data.result_code === '0') {
          that.setData({
            'BrandList': res.data.result_data.BrandList,
            'SeriesList1': res.data.result_data.SeriesList,
            'ModelList1': res.data.result_data.ModelList,
            'DictionaryList': res.data.result_data.DictionaryList,
          })
          if (res.data.result_data.BrandList.length > 0) {
            that.setData({
              'form.Brand': res.data.result_data.BrandList[0].BrandName
            })
          }
          const e = {
            detail: {
              value: "0"
            }
          }
          that.bindPickerChange(e)
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
  },
  save: function(e) {
    const params = e.detail.value
    //验证表单
    if (!this.WxValidate.checkForm(params)) {
      const error = this.WxValidate.errorList[0]
      this.showModal(error)
      return false
    }
    params.ClassName = this.ClassName
    params.StoreId = this.StoreId
    params.OpUser = this.UserNo
    wx.request({
      url: 'https://applet.myszgroup.cn:7779/api//UserPage/RegisterMember',
      method: 'POST',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: params,
      success: function(res) {
        if (res.data.result_code === '0') {
          wx.showToast({
            title: '在线办卡成功',
            icon: 'success',
            duration: 2000
          })
          wx.redirectTo({
            url: '../index/index',
            success: function(data) {
              // 通过eventChannel向被打开页面传送数据
              // data.eventChannel.emit('acceptDataFromOpenerPage', { data1: '办卡' })
            }
          })
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
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})