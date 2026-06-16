// pages/customer-card/customer-card.js
const pinyin = require('../vendor/tiny-pinyin/index.js')
import WxValidate from '../utils/WxValidate.js'
const cwx = require('../../../utils/profunc.js');
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
    DictionaryList: [],
    showSeriesDropdown: false,
    seriesDropdown: [],
    showModelDropdown: false,
    modelDropdown: [],
    _keyboardHandler: null,
    keyboardHeight: 0, // 新增字段
    scrollTop: 0, // 记录当前滚动位置
    pagePaddingBottom: 0,
    isKeyboardShown: false,
    activeScrollTarget: '',
    agreePolicy: false
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
      eventChannel.on('acceptDataFromOpenerPage', function (data) {
        that.ClassName = data.data1.ClassName
        that.StoreId = data.data1.StoreId
        that.UserNo = data.data1.UserNo
      })
    }
    this.initValidate()
    rules: { }
    messages: { }
    this._kbdSubscribed = false;      // 新增：是否已订阅
    this._kbdOpenHandled = false;     // 新增：本次键盘打开是否已处理滚动
    this._scrolledThisOpen = false;   // 新增：本次打开是否已滚动
    this._scrollingLock = false;
  },
  onShow() {
    // 仅订阅一次
    if (!this._kbdSubscribed && wx.onKeyboardHeightChange) {
      this._keyboardHandler = (res) => {
        const h = (res && res.height) ? Math.round(res.height) : 0;
        const pad = h > 0 ? h + 40 : 0;
        const needPadUpdate = this.data.pagePaddingBottom !== pad;
        const isSeriesOrModel = this.data.activeScrollTarget === 'series' || this.data.activeScrollTarget === 'model';

        if (h > 0 && !this._kbdOpenHandled) {
          // 键盘首次打开
          this._kbdOpenHandled = true;
          this._scrolledThisOpen = false;
          this.data.isKeyboardShown = true;

          this.setData({
            keyboardHeight: h,
            pagePaddingBottom: isSeriesOrModel ? pad : 0, // 仅车系/车型时加 padding
            isKeyboardShown: true
          }, () => {
            if (isSeriesOrModel) this.scrollToInputFieldOnce();
          });
        } else if (h === 0) {
          // 键盘关闭，复位
          this._kbdOpenHandled = false;
          this._scrolledThisOpen = false;
          this._scrollingLock = false;
          this.data.isKeyboardShown = false;

          this.setData({
            keyboardHeight: 0,
            pagePaddingBottom: 0,
            isKeyboardShown: false
          });
        } else {
          // 中间高度变化：仅更新 padding（且只在车系/车型时）
          if (isSeriesOrModel) {
            if (needPadUpdate) this.setData({ keyboardHeight: h, pagePaddingBottom: pad });
          } else {
            // 其他输入：不加 padding
            if (this.data.pagePaddingBottom !== 0) this.setData({ pagePaddingBottom: 0, keyboardHeight: h });
          }
        }
      };
      wx.onKeyboardHeightChange(this._keyboardHandler);
      this._kbdSubscribed = true;
    }
  },

  onHide() {
    if (this._keyboardHandler && wx.offKeyboardHeightChange) {
      wx.offKeyboardHeightChange(this._keyboardHandler);
    }
    this._keyboardHandler = null;
    this._kbdSubscribed = false;
    this._kbdOpenHandled = false;
    this._scrolledThisOpen = false;
    this._scrollingLock = false;
    this.setData({ keyboardHeight: 0, pagePaddingBottom: 0, isKeyboardShown: false });
  },
  // 手动滚动到输入框
  scrollToInputFieldOnce() {
    if (this._scrollingLock || this._scrolledThisOpen) return;

    const targetSelector =
      this.data.activeScrollTarget === 'series' ? '#seriesInput' :
        this.data.activeScrollTarget === 'model' ? '#modelInput' : '';

    if (!targetSelector) return; // 非车系/车型，不滚动

    this._scrollingLock = true;
    const pad = (this.data.keyboardHeight || 0) + 40;

    const ensurePad = () => new Promise(resolve => {
      const shouldPad = pad;
      if (this.data.pagePaddingBottom === shouldPad) return resolve();
      this.setData({ pagePaddingBottom: shouldPad }, () => wx.nextTick(resolve));
    });

    ensurePad().then(() => {
      const q = wx.createSelectorQuery();
      q.selectViewport().scrollOffset();
      q.select(targetSelector).boundingClientRect();
      q.exec((res) => {
        const vp = res && res[0];
        const rect = res && res[1];
        if (vp && rect) {
          // 正确计算：当前页面滚动 + 目标相对视口的 top - 微偏移
          const targetTop = Math.max(0, vp.scrollTop + rect.top - 12);
          wx.pageScrollTo({ scrollTop: targetTop, duration: 200 });
        }
        setTimeout(() => {
          this._scrollingLock = false;
          this._scrolledThisOpen = true; // 本次键盘打开周期已滚过
        }, 240);
      });
    });
  },
  // 记录页面滚动位置
  onPageScroll(e) {
    this.setData({ scrollTop: e.scrollTop });
  },
  bindTimeChange: function (e) {
    this.setData({
      'form.BuyDate': e.detail.value
    })
  },
  bindTimeChange1: function (e) {
    this.setData({
      'form.BxEndDate': e.detail.value
    })
  },
  bindPickerChange: function (e) {
    // 防护：确保 BrandList 存在且索引有效
    const idx = Number(e.detail.value)
    if (!this.data.BrandList || this.data.BrandList.length === 0) {
      console.warn('bindPickerChange: BrandList empty or undefined')
      this.setData({ 'SeriesList': [] })
      return
    }
    if (isNaN(idx) || idx < 0 || idx >= this.data.BrandList.length) {
      console.warn('bindPickerChange: invalid index', e.detail.value)
      return
    }
    const filterBrandId = this.data.BrandList[idx].BrandId
    const arr = (this.data.SeriesList1 || []).filter(v => v.BrandId === filterBrandId)
    this.setData({
      'form.Brand': this.data.BrandList[idx].BrandName,
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
  onModelFocus() {
    const list = this.data.ModelList || [];
    this._scrolledThisOpen = false; // 允许本次目标滚动
    this.setData({
      activeScrollTarget: 'model', // 仅车型时触发滚动/加 padding
      showModelDropdown: true,
      modelDropdown: list.slice(0, 20),
      // 如果键盘已弹起，立刻为车型加 padding 并滚动一次
      pagePaddingBottom: this.data.isKeyboardShown ? (this.data.keyboardHeight + 40) : this.data.pagePaddingBottom
    }, () => {
      if (this.data.isKeyboardShown) this.scrollToInputFieldOnce();
    });
  },
  onModelInput(e) {
    const val = e.detail.value; // 允许空格
    this.setData({ 'form.Model': val });
    const list = this.data.ModelList || [];
    const filtered = val
      ? list.filter(m => {
        const name = m.ModelName || '';
        // 使用 convertToPinyin 进行匹配
        const pinyinName = pinyin.convertToPinyin(name, '', true);
        return pinyinName.indexOf(val) !== -1 || name.indexOf(val) !== -1;
      }).slice(0, 20)
      : list.slice(0, 20);
    this.setData({
      showModelDropdown: true,
      modelDropdown: filtered
    });
  },
  onModelBlur() {
    clearTimeout(this._modelBlurTimer);
    this._modelBlurTimer = setTimeout(() => {
      // 失焦后清理目标，且若键盘仍在，则移除 padding
      this.setData({
        showModelDropdown: false,
        activeScrollTarget: '',
        pagePaddingBottom: this.data.isKeyboardShown ? 0 : this.data.pagePaddingBottom
      });
    }, 150);
  },
  toggleModelDropdown() {
    if (this.data.showModelDropdown) {
      this.setData({ showModelDropdown: false })
    } else {
      const list = this.data.ModelList || []
      this.setData({
        showModelDropdown: true,
        modelDropdown: list.slice(0, 20)
      })
    }
  },
  selectModelOption(e) {
    clearTimeout(this._modelBlurTimer);
    const idx = e.currentTarget.dataset.index; // 获取索引
    const item = (this.data.modelDropdown || [])[idx]; // 获取选中的项
    if (!item) {
      this.setData({ showModelDropdown: false });
      return;
    }

    // 阻止输入框失去焦点
    wx.hideKeyboard(); // 隐藏键盘
    this.setData({
      'form.Model': item.ModelName, // 更新表单数据
      showModelDropdown: false
    }, () => {
      const globalIndex = (this.data.ModelList || [])
        .findIndex(m => m.ModelId === item.ModelId || m.ModelName === item.ModelName);
      if (globalIndex > -1 && typeof this.bindPickerChange2 === 'function') {
        this.bindPickerChange2({ detail: { value: globalIndex } });
      }
    });
  },
  onSeriesFocus() {
    const list = this.data.SeriesList || [];
    this._scrolledThisOpen = false;
    this.setData({
      activeScrollTarget: 'series', // 仅车系时触发滚动/加 padding
      showSeriesDropdown: true,
      seriesDropdown: list.slice(0, 20),
      pagePaddingBottom: this.data.isKeyboardShown ? (this.data.keyboardHeight + 40) : this.data.pagePaddingBottom
    }, () => {
      if (this.data.isKeyboardShown) this.scrollToInputFieldOnce();
    });
  },
  onSeriesInput(e) {
    const val = e.detail.value; // 获取当前输入的值
    const previousSeries = this.data.form.Series; // 获取之前的车系值

    // 如果车系值发生变化，清空车型
    if (val !== previousSeries) {
      this.setData({
        'form.Model': '' // 清空车型
      });
    }

    this.setData({ 'form.Series': val });
    const list = this.data.SeriesList || [];
    const filtered = val
      ? list.filter(s => {
        const seriesName = s.SeriesName || '';
        // 使用 convertToPinyin 进行匹配
        const pinyinName = pinyin.convertToPinyin(seriesName, '', true);
        return pinyinName.indexOf(val) !== -1 || seriesName.indexOf(val) !== -1;
      }).slice(0, 20)
      : list.slice(0, 20)

    this.setData({
      showSeriesDropdown: true,
      seriesDropdown: filtered
    });
  },
  onSeriesBlur() {
    clearTimeout(this._seriesBlurTimer);
    this._seriesBlurTimer = setTimeout(() => {
      this.setData({
        showSeriesDropdown: false,
        activeScrollTarget: '',
        pagePaddingBottom: this.data.isKeyboardShown ? 0 : this.data.pagePaddingBottom
      });
    }, 150);
  },
  toggleSeriesDropdown() {
    if (this.data.showSeriesDropdown) {
      this.setData({ showSeriesDropdown: false })
    } else {
      const list = this.data.SeriesList || []
      this.setData({
        showSeriesDropdown: true,
        seriesDropdown: list.slice(0, 20)
      })
    }
  },
  selectSeriesOption(e) {
    clearTimeout(this._seriesBlurTimer);
    const idx = e.currentTarget.dataset.index; // 获取索引
    const item = (this.data.seriesDropdown || [])[idx]; // 获取选中的项
    if (!item) {
      this.setData({ showSeriesDropdown: false });
      return;
    }

    // 阻止输入框失去焦点
    wx.hideKeyboard(); // 隐藏键盘
    this.setData({
      'form.Model': '',
      'form.Series': item.SeriesName, // 更新表单数据
      showSeriesDropdown: false
    }, () => {
      const globalIndex = (this.data.SeriesList || [])
        .findIndex(s => s.SeriesId === item.SeriesId || s.SeriesName === item.SeriesName);
      if (globalIndex > -1 && typeof this.bindPickerChange1 === 'function') {
        this.bindPickerChange1({ detail: { value: globalIndex } });
      }
    });
  },
  changephone() {
    var that = this;
    cwx.OcrIdCard(that.data.access_token).then(function (_res) {
      const string = JSON.parse(_res)
      const trdata = JSON.parse(string)
      if (trdata.errcode === 0) {
        if (trdata.owner) {
          // 截取 trdata.model 中“牌”字之前的内容作为品牌（若无 "牌" 则取全部）
          let brandFromModel = ''
          try {
            const rawModel = trdata.model || ''
            const idx = rawModel.indexOf('牌')
            brandFromModel = idx > -1 ? rawModel.substring(0, idx) : rawModel
          } catch (e) {
            brandFromModel = ''
          }
          that.setData({
            'form.GuestName': trdata.owner,
            'form.RegisterNo': trdata.plate_num,
            'form.Vin': trdata.vin,
            'form.Address': trdata.addr,
            'form.BuyDate': trdata.register_date,
            'form.Brand': brandFromModel
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
        minlength: 2
      },
      Mobile: {
        required: true,
        tel: true
      },
      RegisterNo: {
        required: true
      },
      Vin: {
        required: true,
        numberlength: 17
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
        minlength: '请输入正确的名称'
      },
      Mobile: {
        required: '请填写手机号',
        tel: '请填写正确的手机号'
      },
      RegisterNo: {
        required: '请填写车牌号'
      },
      Vin: {
        required: '请填写车架号',
        numberlength: '请输入17位有效车架号'
      },
      Series: {
        required: '请填写车系'
      },
      Department: {
        required: '请填写部门'
      }
    }
    this.WxValidate = new WxValidate(rules, messages)
  },
  getlist: function (e) {
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
      success: function (res) {
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
          // 触发一次品牌选择的默认渲染，确保索引为数字
          if (that.data.BrandList && that.data.BrandList.length > 0) {
            that.bindPickerChange({ detail: { value: 0 } })
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
  save: function (e) {
    if (!this.data.agreePolicy) {
      wx.showModal({
        content: '请先阅读并同意《用户服务协议》和《隐私政策》',
        showCancel: false
      })
      return false
    }

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
      success: function (res) {
        if (res.data.result_code === '0') {
          wx.showToast({
            title: '在线办卡成功',
            icon: 'success',
            duration: 2000
          })
          wx.redirectTo({
            url: '/pages/index/index',
            success: function (data) {
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
      fail: function (erroe) {
        wx.showModal({
          content: res.data.result_msg,
          showCancel: false
        })
      }
    })
  },
  onAgreementChange: function (e) {
    var selected = e && e.detail && Array.isArray(e.detail.value) ? e.detail.value : []
    this.setData({
      agreePolicy: selected.indexOf('agree') !== -1
    })
  },
  openAgreementPage: function (e) {
    var type = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.type : ''
    var url = ''

    if (type === 'user') {
      url = '/subpackages/member/policy/user-agreement'
    }
    if (type === 'privacy') {
      url = '/subpackages/member/policy/privacy-policy'
    }

    if (!url) {
      return
    }

    wx.navigateTo({ url: url })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    if (this._keyboardHandler && wx.offKeyboardHeightChange) {
      wx.offKeyboardHeightChange(this._keyboardHandler);
    }
    this._keyboardHandler = null;
    this._kbdSubscribed = false;
    this._kbdOpenHandled = false;
    this._scrolledThisOpen = false;
    this._scrollingLock = false;
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