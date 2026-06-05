const app = getApp();
const miniProgramApi = require('../api/MiniProgramApi');
const request = require('../../../utils/request');

Page({
  data: {
    SfCardId: '1',
    option1: [
      { text: '车牌号', value: '1' },
      { text: '车架号', value: '2' }
    ],
    RegisterNo: '',
    showVehiclePicker: false,
    queryVehicleList: [],
    selectedVehicleIndex: 0,
    selectedVehicle: null,
    memberProfile: {},
    fixedInsuranceItems: [
      { name: '划痕险', amountText: '未投保' },
      { name: '三者险', amountText: '未投保' },
      { name: '车损险', amountText: '未投保' }
    ],
    hasMemberProfile: false,
    activeTab: 'archive',
    isMember: false,
    showInviteModal: false,
    showMediaModal: false,
    showCarousel: false,
    currentMethod: '',
    mediaModalTitle: '上传沟通凭证',
    mediaModalDesc: '请上传相关截图并填写沟通摘要',
    mediaTopic: '线上邀约',
    mediaContent: '',
    mediaNeedImage: true,
    mediaUploadLimit: 1,
    uploadedImage: '',
    uploadedImageUrl: '',
    uploadedImageList: [],
    carouselIndex: 0,
    carouselTitle: '商业险凭证',
    carouselItems: [],
    carouselImages: [],
    usedCarEstimateLoading: false,
    coupons: [],
    followRecords: [],
    complaints: []
  },
  onLoad: function () {
    this.setData({
      SfCardId: '1',
      RegisterNo: ''
    });
  },
  noop: function () {},
  onChangedropdown: function (e) {
    this.setData({
      SfCardId: String(e.detail || '1')
    });
  },
  onChangefield: function (e) {
    var value = '';
    if (typeof e.detail === 'string') {
      value = e.detail;
    }
    if (e.detail && typeof e.detail.value === 'string') {
      value = e.detail.value;
    }
    this.setData({ RegisterNo: value });
  },
  showApiError: function (msg) {
    wx.showModal({
      content: msg || '请求失败',
      showCancel: false
    });
  },
  startLoading: function (title) {
    this._loadingCount = (this._loadingCount || 0) + 1;
    if (this._loadingCount === 1) {
      wx.showLoading({
        title: title || '加载中',
        mask: true
      });
    }
  },
  stopLoading: function () {
    if (!this._loadingCount) {
      return;
    }
    this._loadingCount -= 1;
    if (this._loadingCount <= 0) {
      this._loadingCount = 0;
      wx.hideLoading();
    }
  },
  getList: function () {
    var sfCardId = this.data.SfCardId;
    var inputValue = (this.data.RegisterNo || '').trim();
    var searchValue = '';

    if (sfCardId === '1') {
      // 与 member-inquiry 保持一致：车牌号先去空格并清除特殊字符。
      searchValue = inputValue.replace(/\s/g, '').replace(/[^A-Za-z0-9\u4e00-\u9fa5]/g, '');
      if (searchValue.length < 5) {
        wx.showModal({
          content: '车牌号不能少于5位',
          showCancel: false
        });
        return;
      }
    } else {
      searchValue = inputValue;
      if (searchValue.length < 7) {
        wx.showModal({
          content: '车架号不能少于7位',
          showCancel: false
        });
        return;
      }
    }

    var serviceGroupId =
      app.globalData.ServiceGroupId

    this.startLoading('查询中');

    miniProgramApi
      .searchVehicleForSelect({
        serviceGroupId: String(serviceGroupId),
        queryType: String(sfCardId),
        queryValue: searchValue
      })
      .then(function (body) {
        var list = this.normalizeVehicleList(body);

        if (!list.length) {
          this.showApiError('未查询到车辆信息');
          this.stopLoading();
          return;
        }

        if (list.length === 1) {
          this.stopLoading();
          this.applySelectedVehicle(list[0], list, 0);
          return;
        }

        this.setData({
          showVehiclePicker: true,
          queryVehicleList: list,
          selectedVehicleIndex: 0
        });
        this.stopLoading();
      }.bind(this))
      .catch(function (err) {
        var errMsg = request.extractApiErrorMessage(err, '查询失败，请稍后重试');
        this.showApiError(errMsg);
        this.stopLoading();
      }.bind(this));
  },
  normalizeVehicleList: function (body) {
    var resultData = body && body.result_data;
    if (Array.isArray(resultData)) {
      return resultData;
    }
    if (resultData && typeof resultData === 'object') {
      return [resultData];
    }
    return [];
  },
  getDefaultInsuranceItems: function () {
    return [
      { name: '划痕险', amountText: '未投保' },
      { name: '三者险', amountText: '未投保' },
      { name: '车损险', amountText: '未投保' }
    ];
  },
  buildFixedInsuranceItems: function (items) {
    var source = Array.isArray(items) ? items : [];
    var targets = [
      { name: '划痕险', keywords: ['划痕'] },
      { name: '三者险', keywords: ['三者', '第三者'] },
      { name: '车损险', keywords: ['车损', '机动车损失'] }
    ];

    return targets.map(function (target) {
      var matched = source.find(function (ins) {
        var name = (ins && ins.name ? String(ins.name) : '').trim();
        if (!name) {
          return false;
        }
        if (name === target.name) {
          return true;
        }
        return target.keywords.some(function (keyword) {
          return name.indexOf(keyword) !== -1;
        });
      });

      var amountText = matched && matched.amountText ? String(matched.amountText).trim() : '';
      return {
        name: target.name,
        amountText: amountText || '未投保'
      };
    });
  },
  getInsuranceImageTitle: function (imageType) {
    var type = String(imageType === undefined || imageType === null ? '' : imageType);
    if (type === '1') {
      return '交强险凭证';
    }
    if (type === '2') {
      return '商业险凭证';
    }
    if (type === '3') {
      return '驾意险凭证';
    }
    return '保险凭证';
  },
  formatFollowDate: function (value) {
    if (!value) {
      return '--';
    }

    var text = String(value).trim();
    if (!text) {
      return '--';
    }

    var normalized = text.replace('T', ' ');
    var match = normalized.match(/^(\d{4}-\d{2}-\d{2})[\s]+(\d{2}:\d{2})/);
    if (match) {
      return match[1] + ' · ' + match[2];
    }

    return normalized;
  },
  formatCouponDate: function (value) {
    if (!value) {
      return '--';
    }

    var text = String(value).trim();
    if (!text) {
      return '--';
    }

    var normalized = text.replace('T', ' ');
    var match = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      return match[1];
    }

    return normalized;
  },
  normalizeCouponList: function (body) {
    var resultData = body && body.result_data;
    var source = [];

    if (Array.isArray(resultData)) {
      source = resultData;
    } else if (resultData && typeof resultData === 'object') {
      source = [resultData];
    }

    return source.map(function (item) {
      var record = item || {};
      var name = record.name ? String(record.name).trim() : '';
      var remark = record.remark ? String(record.remark).trim() : '';
      var startDate = record.startDate ? String(record.startDate).trim() : '';
      var endDate = record.endDate ? String(record.endDate).trim() : '';
      var startText = this.formatCouponDate(startDate);
      var endText = this.formatCouponDate(endDate);
      var dateText = '--';

      if (startText !== '--' && endText !== '--') {
        dateText = startText + ' - ' + endText;
      } else if (endText !== '--') {
        dateText = '有效期至 ' + endText;
      } else if (startText !== '--') {
        dateText = '生效日期 ' + startText;
      }

      return {
        name: name,
        remark: remark,
        startDate: startDate,
        endDate: endDate,
        title: name || '--',
        desc: remark || '--',
        date: dateText
      };
    }.bind(this));
  },
  normalizeInvitationHistoryList: function (body) {
    var resultData = body && body.result_data;
    var source = [];

    if (Array.isArray(resultData)) {
      source = resultData;
    } else if (resultData && typeof resultData === 'object') {
      source = [resultData];
    }

    return source.map(function (item) {
      var record = item || {};
      var id = record.id;
      var inviteType = record.inviteType ? String(record.inviteType).trim() : '';
      var inviteContent = record.inviteContent ? String(record.inviteContent).trim() : '';
      var inviteImages = this.normalizeInviteImages(record.inviteImages);
      var inviterName = record.inviterName ? String(record.inviterName).trim() : '';
      var createDate = record.createDate ? String(record.createDate).trim() : '';

      return {
        id: id,
        inviteType: inviteType,
        inviteContent: inviteContent,
        inviteImages: inviteImages,
        inviterName: inviterName,
        createDate: createDate,
        date: this.formatFollowDate(createDate),
        method: inviteType || '--',
        content: inviteContent || '--',
        staff: inviterName ? '招揽员：' + inviterName : '招揽员：--',
        image: inviteImages.length ? inviteImages[0] : ''
      };
    }.bind(this));
  },
  normalizeInviteImages: function (value) {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.filter(function (item) {
        return !!item;
      }).map(function (item) {
        return String(item).trim();
      }).filter(function (item) {
        return !!item;
      });
    }

    if (typeof value === 'string') {
      var text = value.trim();
      if (!text) {
        return [];
      }

      if (text.charAt(0) === '[') {
        try {
          return this.normalizeInviteImages(JSON.parse(text));
        } catch (e) {
          return text.split(',').map(function (item) {
            return item.trim();
          }).filter(function (item) {
            return !!item;
          });
        }
      }

      return text.split(',').map(function (item) {
        return item.trim();
      }).filter(function (item) {
        return !!item;
      });
    }

    if (typeof value === 'object') {
      var firstUrl = value.url || value.Url || value.imageUrl || value.ImageUrl || '';
      return firstUrl ? [String(firstUrl).trim()] : [];
    }

    return [];
  },
  fetchInvitationHistory: function (vehicle) {
    var item = vehicle || {};
    var serviceGroupId = app.globalData.ServiceGroupId;
    var vehicleId = item.vehicleId;

    if (serviceGroupId === undefined || serviceGroupId === null || serviceGroupId === '') {
      return Promise.resolve();
    }

    if (vehicleId === undefined || vehicleId === null || vehicleId === '') {
      return Promise.resolve();
    }

    this.startLoading('记录加载中');

    return miniProgramApi
      .getInvitationHistory({
        serviceGroupId: String(serviceGroupId),
        vehicleId: String(vehicleId)
      })
      .then(function (body) {
        this.setData({
          followRecords: this.normalizeInvitationHistoryList(body)
        });
        this.stopLoading();
      }.bind(this))
      .catch(function (err) {
        console.error('GetInvitationHistory failed:', err);
        this.setData({ followRecords: [] });
        this.stopLoading();
      }.bind(this));
  },
  fetchMemberCoupons: function (vehicle) {
    var item = vehicle || {};
    var serviceGroupId = app.globalData.ServiceGroupId;
    var vehicleId = item.vehicleId;

    if (serviceGroupId === undefined || serviceGroupId === null || serviceGroupId === '') {
      return Promise.resolve();
    }

    if (vehicleId === undefined || vehicleId === null || vehicleId === '') {
      return Promise.resolve();
    }

    this.startLoading('优惠券加载中');

    return miniProgramApi
      .getMemberCouponsByVehicle({
        serviceGroupId: String(serviceGroupId),
        vehicleId: String(vehicleId)
      })
      .then(function (body) {
        this.setData({
          coupons: this.normalizeCouponList(body)
        });
        this.stopLoading();
      }.bind(this))
      .catch(function (err) {
        console.error('GetMemberCouponsByVehicle failed:', err);
        this.setData({ coupons: [] });
        this.stopLoading();
      }.bind(this));
  },
  normalizeComplaintList: function (body) {
    var resultData = body && body.result_data;

    if (Array.isArray(resultData)) {
      return resultData;
    }
    if (resultData && typeof resultData === 'object') {
      return [resultData];
    }
    return [];
  },
  fetchComplaintList: function (vehicle) {
    var item = vehicle || {};
    var serviceGroupId = app.globalData.ServiceGroupId;
    var vehicleId = item.vehicleId;

    if (serviceGroupId === undefined || serviceGroupId === null || serviceGroupId === '') {
      return Promise.resolve();
    }

    if (vehicleId === undefined || vehicleId === null || vehicleId === '') {
      return Promise.resolve();
    }

    this.startLoading('投诉加载中');

    return miniProgramApi
      .getComplaintListByVehData({
        serviceGroupId: String(serviceGroupId),
        vehicleId: String(vehicleId)
      })
      .then(function (body) {
        this.setData({
          complaints: this.normalizeComplaintList(body)
        });
        this.stopLoading();
      }.bind(this))
      .catch(function (err) {
        console.error('GetComplaintListByVehData failed:', err);
        this.setData({ complaints: [] });
        this.stopLoading();
      }.bind(this));
  },
  applySelectedVehicle: function (vehicle, list, index) {
    var item = vehicle || {};

    this._usedCarEstimateToken = (this._usedCarEstimateToken || 0) + 1;

    this.setData({
      selectedVehicle: item,
      memberProfile: {},
      fixedInsuranceItems: this.getDefaultInsuranceItems(),
      hasMemberProfile: false,
      isMember: false,
      activeTab: 'archive',
      queryVehicleList: list || [item],
      selectedVehicleIndex: typeof index === 'number' ? index : 0,
      showVehiclePicker: false,
      usedCarEstimateLoading: false,
      followRecords: [],
      coupons: [],
      complaints: []
    });

    this.fetchVehicleMemberProfile(item);
  },
  fetchVehicleMemberProfile: function (vehicle) {
    var item = vehicle || {};
    var serviceGroupId = app.globalData.ServiceGroupId;
    var vehicleId = item.vehicleId;

    if (serviceGroupId === undefined || serviceGroupId === null || serviceGroupId === '') {
      this.showApiError('serviceGroupId为空，无法查询会员档案');
      return;
    }

    if (vehicleId === undefined || vehicleId === null || vehicleId === '') {
      this.showApiError('vehicleId为空，无法查询会员档案');
      return;
    }

    this.startLoading('档案加载中');

    miniProgramApi
      .getVehicleMemberProfile({
        serviceGroupId: String(serviceGroupId),
        vehicleId: String(vehicleId)
      })
      .then(function (body) {
        var profile = (body && body.result_data) || {};
        var imageItems = [];
        var fixedInsuranceItems = this.buildFixedInsuranceItems(profile.commercialInsuranceItems);

        if (Array.isArray(profile.lastRenewalInsuranceImages)) {
          profile.lastRenewalInsuranceImages.forEach(function (group) {
            if (group && Array.isArray(group.imageUrls)) {
              var title = this.getInsuranceImageTitle(group.imageType);
              group.imageUrls.forEach(function (url) {
                if (url) {
                  imageItems.push({
                    url: url,
                    imageType: group.imageType,
                    title: title
                  });
                }
              });
            }
          }.bind(this));
        }

        this.setData({
          memberProfile: profile,
          fixedInsuranceItems: fixedInsuranceItems,
          hasMemberProfile: !!(profile && Object.keys(profile).length),
          isMember: profile.isMember === true,
          carouselItems: imageItems,
          carouselImages: imageItems.map(function (item) {
            return item.url;
          }),
          carouselIndex: 0,
          carouselTitle: imageItems.length ? imageItems[0].title : '保险凭证'
        });
        this.stopLoading();

        this.startUsedCarEstimate(profile);
      }.bind(this))
      .catch(function (err) {
        var errMsg = request.extractApiErrorMessage(err, '会员档案查询失败，请稍后重试');
        this.showApiError(errMsg);
        this.setData({ usedCarEstimateLoading: false });
        this.stopLoading();
      }.bind(this));
  },
  pickFordLatestMileage: function (source) {
    var data = source && typeof source === 'object' ? source : {};
    console.log('pickFordLatestMileage:', data);
    var keys = [
      'lateSTMILEAGE',
      'lateST MILEAGE',
      'latestMileage',
      'LATEST_MILEAGE',
      'latest_mileage',
      'latesT_MILEAGE'
    ];

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== null && data[key] !== undefined) {
        var text = String(data[key]).trim();
        if (text) {
          return text;
        }
      }
    }

    return '';
  },
  fetchFordMileageByVin: function (profile) {
    var sourceProfile = profile && typeof profile === 'object' ? profile : {};
    var serviceGroupId = app.globalData.ServiceGroupId;
    var vin = sourceProfile.vin;

    if (serviceGroupId === undefined || serviceGroupId === null || serviceGroupId === '') {
      return Promise.resolve('');
    }

    if (vin === undefined || vin === null || String(vin).trim() === '') {
      return Promise.resolve('');
    }

    return miniProgramApi
      .getFordBaseCustomerByVin({
        brand: 'Ford',
        vin: String(vin).trim(),
        serviceGroupId: String(serviceGroupId)
      })
      .then(function (body) {
        var resultData = body && body.data;
        var data = (resultData && typeof resultData === 'object') ? resultData : {};
        console.log('getFordBaseCustomerByVin:', data);
        var mileage = this.pickFordLatestMileage(data);

        return mileage || '';
      }.bind(this))
      .catch(function () {
        return '';
      }.bind(this));
  },
  startUsedCarEstimate: function (profile) {
    var sourceProfile = profile && typeof profile === 'object' ? profile : {};
    var vehicleId = sourceProfile.vehicleId;
    var estimateToken = (this._usedCarEstimateToken || 0) + 1;

    this._usedCarEstimateToken = estimateToken;

    if (vehicleId === undefined || vehicleId === null || vehicleId === '') {
      this.setData({ usedCarEstimateLoading: false });
      return;
    }

    this.setData({ usedCarEstimateLoading: true });

    this.fetchFordMileageByVin(sourceProfile)
      .then(function (fordLatestMileage) {
        if (estimateToken !== this._usedCarEstimateToken) {
          return Promise.reject(new Error('估价请求已过期'));
        }

        var latestProfile = this.data.memberProfile || {};
        if (latestProfile.vehicleId !== vehicleId) {
          return Promise.reject(new Error('车辆已切换'));
        }

        var profileForEstimate = Object.assign({}, latestProfile, {
          fordLatestMileage: fordLatestMileage
        });

        return this.tryEstimateUsedCarPurchasePrice(profileForEstimate, estimateToken);
      }.bind(this))
      .catch(function (err) {
        if (estimateToken !== this._usedCarEstimateToken) {
          return;
        }

        console.error('startUsedCarEstimate failed:', err);
        this.setData({ usedCarEstimateLoading: false });
      }.bind(this));
  },
  getDeepseekRuntimeConfig: function () {
    var appApiKey = app && app.globalData ? app.globalData.DeepSeekApiKey : '';
    var appEndpoint = app && app.globalData ? app.globalData.DeepSeekEndpoint : '';
    var appModel = app && app.globalData ? app.globalData.DeepSeekModel : '';

    var storageApiKey = '';
    var storageEndpoint = '';
    var storageModel = '';

    try {
      storageApiKey = wx.getStorageSync('deepseek_api_key') || '';
      storageEndpoint = wx.getStorageSync('deepseek_endpoint') || '';
      storageModel = wx.getStorageSync('deepseek_model') || '';
    } catch (e) {
      storageApiKey = '';
      storageEndpoint = '';
      storageModel = '';
    }

    return {
      apiKey: String(appApiKey || storageApiKey || '').trim(),
      endpoint: String(appEndpoint || storageEndpoint || '').trim(),
      model: String(appModel || storageModel || '').trim()
    };
  },
  tryEstimateUsedCarPurchasePrice: function (profile, token) {
    var sourceProfile = profile && typeof profile === 'object' ? profile : {};
    var vehicleId = sourceProfile.vehicleId;
    var estimateToken = typeof token === 'number' ? token : ((this._usedCarEstimateToken || 0) + 1);

    if (typeof token !== 'number') {
      this._usedCarEstimateToken = estimateToken;
    }

    if (vehicleId === undefined || vehicleId === null || vehicleId === '') {
      this.setData({ usedCarEstimateLoading: false });
      return;
    }

    var cfg = this.getDeepseekRuntimeConfig();

    return miniProgramApi
      .estimateUsedCarPurchasePrice({
        profile: sourceProfile,
        apiKey: cfg.apiKey,
        endpoint: cfg.endpoint,
        model: cfg.model
      })
      .then(function (body) {
        var resultData = body && body.result_data ? body.result_data : {};
        var estimated = resultData.usedCarPurchasePrice;

        if (estimateToken !== this._usedCarEstimateToken) {
          return;
        }

        var latestProfile = this.data.memberProfile || {};
        if (latestProfile.vehicleId !== vehicleId) {
          return;
        }

        if (estimated === null || estimated === undefined || estimated === '') {
          this.setData({
            usedCarEstimateLoading: false,
            memberProfile: Object.assign({}, latestProfile, {
              usedCarPurchasePrice: ''
            })
          });
          return;
        }

        this.setData({
          usedCarEstimateLoading: false,
          memberProfile: Object.assign({}, latestProfile, {
            usedCarPurchasePrice: estimated
          })
        });
      }.bind(this))
      .catch(function (err) {
        if (estimateToken !== this._usedCarEstimateToken) {
          return;
        }

        console.error('estimateUsedCarPurchasePrice failed:', err);
        this.setData({ usedCarEstimateLoading: false });
      }.bind(this));
  },
  onSelectVehicle: function (e) {
    var index = Number(e.currentTarget.dataset.index || 0);
    this.setData({ selectedVehicleIndex: index });
  },
  confirmVehicleSelection: function () {
    var idx = this.data.selectedVehicleIndex;
    var list = this.data.queryVehicleList || [];
    var picked = list[idx];

    if (!picked) {
      this.showApiError('请选择一条车辆信息');
      return;
    }

    this.applySelectedVehicle(picked, list, idx);
  },
  closeVehiclePicker: function () {
    this.setData({ showVehiclePicker: false });
  },
  getDaysLeft: function () {
    var expiry = new Date(2026, 6, 30);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var diff = expiry.getTime() - today.getTime();
    var days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 0;
  },
  switchTab: function (e) {
    var tab = e.currentTarget.dataset.tab;
    var selectedVehicle = this.data.selectedVehicle || {};

    this.setData({ activeTab: tab });

    if (!this.data.hasMemberProfile) {
      return;
    }

    if (!selectedVehicle || !selectedVehicle.vehicleId) {
      return;
    }

    if (tab === 'coupon') {
      this.fetchMemberCoupons(selectedVehicle);
      return;
    }

    if (tab === 'follow') {
      this.fetchInvitationHistory(selectedVehicle);
      return;
    }

    if (tab === 'complaint') {
      this.fetchComplaintList(selectedVehicle);
    }
  },
  handleApplyCard: function () {
    var selectedVehicle = this.data.selectedVehicle || {};
    var serviceGroupId = app.globalData.ServiceGroupId;
    var vehicleId = selectedVehicle.vehicleId;

    if (serviceGroupId === undefined || serviceGroupId === null || serviceGroupId === '') {
      this.showApiError('serviceGroupId为空，无法办理会员卡');
      return;
    }

    if (vehicleId === undefined || vehicleId === null || vehicleId === '') {
      this.showApiError('vehicleId为空，无法办理会员卡');
      return;
    }

    wx.showModal({
      title: '办理会员卡',
      content: '是否确定为该车辆办理会员卡？',
      confirmColor: '#1a6c9e',
      success: function (res) {
        if (!res.confirm) {
          return;
        }

        this.startLoading('办卡中');

        miniProgramApi
          .addMemberInfo({
            serviceGroupId: String(serviceGroupId),
            vehicleId: String(vehicleId)
          })
          .then(function () {
            wx.showToast({
              title: '办卡成功',
              icon: 'success'
            });

            this.fetchVehicleMemberProfile(selectedVehicle);
            this.stopLoading();
          }.bind(this))
          .catch(function (err) {
            var errMsg = request.extractApiErrorMessage(err, '办卡失败，请稍后重试');
            this.showApiError(errMsg);
            this.stopLoading();
          }.bind(this));
      }.bind(this)
    });
  },
  openCarousel: function () {
    var items = this.data.carouselItems || [];
    if (!items.length) {
      return;
    }

    this.setData({
      showCarousel: true,
      carouselIndex: 0,
      carouselTitle: items.length ? items[0].title : '保险凭证'
    });
  },
  closeCarousel: function () {
    this.setData({ showCarousel: false });
  },
  previewInsuranceImage: function (e) {
    var urls = e.currentTarget.dataset.urls || [];
    var current = e.currentTarget.dataset.current || '';

    if (!urls.length || !current) {
      return;
    }

    wx.previewImage({
      current: current,
      urls: urls
    });
  },
  nextImage: function () {
    var idx = this.data.carouselIndex + 1;
    if (idx >= this.data.carouselImages.length) {
      idx = 0;
    }
    var items = this.data.carouselItems || [];
    this.setData({
      carouselIndex: idx,
      carouselTitle: items[idx] ? items[idx].title : '保险凭证'
    });
  },
  prevImage: function () {
    var idx = this.data.carouselIndex - 1;
    if (idx < 0) {
      idx = this.data.carouselImages.length - 1;
    }
    var items = this.data.carouselItems || [];
    this.setData({
      carouselIndex: idx,
      carouselTitle: items[idx] ? items[idx].title : '保险凭证'
    });
  },
  openInviteModal: function () {
    this.setData({ showInviteModal: true });
  },
  closeInviteModal: function () {
    this.setData({ showInviteModal: false });
  },
  chooseInviteMethod: function (e) {
    var method = e.currentTarget.dataset.method;
    this.setData({
      showInviteModal: false,
      currentMethod: method
    });

    if (method === 'call') {
      var phoneNumber = ((this.data.memberProfile || {}).mobile || '').toString().trim();
      var dialNumber = phoneNumber.replace(/\s/g, '');

      if (!dialNumber) {
        this.showApiError('当前客户手机号为空，无法外呼');
        return;
      }

      wx.makePhoneCall({
        phoneNumber: dialNumber,
        complete: function () {
          this.setData({
            showMediaModal: true,
            mediaModalTitle: '外呼沟通记录',
            mediaModalDesc: '请填写本次外呼沟通内容',
            mediaTopic: '外呼邀约',
            mediaContent: '',
            mediaNeedImage: false,
            uploadedImage: '',
            uploadedImageUrl: '',
            uploadedImageList: []
          });
        }.bind(this)
      });
      return;
    }

    var title = '短信邀约凭证';
    var desc = '请上传短信截图并填写沟通摘要';
    var topic = '短信邀约';
    if (method === 'wechat') {
      title = '微信沟通凭证';
      desc = '请上传微信聊天截图并填写沟通摘要';
      topic = '微信邀约';
    }
    if (method === 'wecom') {
      title = '企微沟通凭证';
      desc = '请上传企微截图并填写沟通摘要';
      topic = '企微邀约';
    }

    this.setData({
      showMediaModal: true,
      mediaModalTitle: title,
      mediaModalDesc: desc,
      mediaTopic: topic,
      mediaContent: '',
      mediaNeedImage: true,
      uploadedImage: '',
      uploadedImageUrl: '',
      uploadedImageList: []
    });
  },
  closeMediaModal: function () {
    this.setData({
      showMediaModal: false,
      mediaNeedImage: true,
      uploadedImage: '',
      uploadedImageUrl: '',
      uploadedImageList: []
    });
  },
  chooseImage: function () {
    var that = this;
    var serviceGroupId = app.globalData.ServiceGroupId;
    var storeId = app.globalData.StoreId;
    var remainCount = this.data.mediaUploadLimit - this.data.uploadedImageList.length;

    if (remainCount <= 0) {
      wx.showToast({
        title: '最多上传' + this.data.mediaUploadLimit + '张',
        icon: 'none'
      });
      return;
    }

    if (serviceGroupId === undefined || serviceGroupId === null || serviceGroupId === '') {
      this.showApiError('serviceGroupId为空，无法上传图片');
      return;
    }

    if (storeId === undefined || storeId === null || storeId === '') {
      this.showApiError('storeId为空，无法上传图片');
      return;
    }

    wx.chooseImage({
      count: remainCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var tempFilePaths = Array.isArray(res.tempFilePaths) ? res.tempFilePaths : [];

        if (!tempFilePaths.length) {
          return;
        }

        that.startLoading('上传中');

        Promise.all(tempFilePaths.map(function (tempFilePath) {
          return miniProgramApi.uploadImportImage({
            serviceGroupId: serviceGroupId,
            storeId: storeId,
            filePath: tempFilePath
          })
          .then(function (body) {
            var resultData = body && body.result_data;
            var uploadedImageUrl = '';

            if (typeof resultData === 'string') {
              uploadedImageUrl = resultData.trim();
            } else if (resultData && typeof resultData === 'object') {
              uploadedImageUrl = resultData.url || resultData.Url || resultData.imageUrl || resultData.ImageUrl || '';
            }

            if (!uploadedImageUrl) {
              return Promise.reject(new Error('上传成功但未返回图片地址'));
            }

            return {
              previewUrl: uploadedImageUrl,
              url: uploadedImageUrl
            };
          });
        }))
          .then(function (newImages) {
            var uploadedImageList = (that.data.uploadedImageList || []).concat(newImages);
            var uploadedImage = uploadedImageList.length ? uploadedImageList[0].previewUrl : '';
            var uploadedImageUrl = uploadedImageList.length ? uploadedImageList[0].url : '';

            that.setData({
              uploadedImage: uploadedImage,
              uploadedImageUrl: uploadedImageUrl,
              uploadedImageList: uploadedImageList
            });

            wx.showToast({
              title: '图片上传成功',
              icon: 'success'
            });
            that.stopLoading();
          })
          .catch(function (err) {
            var errMsg = request.extractApiErrorMessage(err, '图片上传失败，请稍后重试');
            that.setData({
              uploadedImage: '',
              uploadedImageUrl: '',
              uploadedImageList: []
            });
            that.showApiError(errMsg);
            that.stopLoading();
          });
      }
    });
  },
  confirmDeleteImage: function () {
    var that = this;
    var index = Number(arguments[0] && arguments[0].currentTarget && arguments[0].currentTarget.dataset.index);

    wx.showModal({
      title: '删除图片',
      content: '确认删除已上传图片吗？',
      confirmColor: '#1a6c9e',
      success: function (res) {
        if (!res.confirm) {
          return;
        }

        var uploadedImageList = (that.data.uploadedImageList || []).filter(function (_item, itemIndex) {
          return itemIndex !== index;
        });

        that.setData({
          uploadedImage: uploadedImageList.length ? uploadedImageList[0].previewUrl : '',
          uploadedImageUrl: uploadedImageList.length ? uploadedImageList[0].url : '',
          uploadedImageList: uploadedImageList
        });
      }
    });
  },
  onTopicInput: function (e) {
    this.setData({ mediaTopic: e.detail.value });
  },
  onContentInput: function (e) {
    this.setData({ mediaContent: e.detail.value });
  },
  getInviteTypeByMethod: function (method) {
    if (method === 'call') {
      return '外呼邀约';
    }
    if (method === 'wechat') {
      return '微信邀约';
    }
    if (method === 'wecom') {
      return '企微邀约';
    }
    return '短信邀约';
  },
  saveMediaRecord: function () {
    var selectedVehicle = this.data.selectedVehicle || {};
    var serviceGroupId = app.globalData.ServiceGroupId;
    var vehicleId = selectedVehicle.vehicleId;
    var topic = (this.data.mediaTopic || '').trim();
    var detail = (this.data.mediaContent || '').trim();
    var inviterName = (app.globalData.UserName || '').trim();
    var inviteType = topic;
    var inviteContent = detail;

    if (serviceGroupId === undefined || serviceGroupId === null || serviceGroupId === '') {
      this.showApiError('serviceGroupId为空，无法保存邀约记录');
      return;
    }

    if (vehicleId === undefined || vehicleId === null || vehicleId === '') {
      this.showApiError('vehicleId为空，无法保存邀约记录');
      return;
    }

    if (!inviteType) {
      this.showApiError('邀约类型不能为空');
      return;
    }

    if (!inviteContent) {
      wx.showToast({
        title: '请填写邀约内容',
        icon: 'none'
      });
      return;
    }

    if (!inviterName) {
      this.showApiError('邀约人不能为空');
      return;
    }

    if (this.data.mediaNeedImage && !this.data.uploadedImageList.length) {
      wx.showToast({
        title: '请先上传图片',
        icon: 'none'
      });
      return;
    }

    this.startLoading('保存中');

    miniProgramApi
      .addInvitation({
        ServiceGroupId: Number(serviceGroupId),
        VehicleId: Number(vehicleId),
        InviteType: inviteType,
        InviteContent: inviteContent,
        InviteImages: this.data.uploadedImageList.map(function (item) {
          return item.url;
        }),
        InviterName: inviterName
      })
      .then(function () {
        wx.showToast({
          title: '邀约成功',
          icon: 'success'
        });

        this.setData({
          showMediaModal: false,
          mediaNeedImage: true,
          uploadedImage: '',
          uploadedImageUrl: '',
          uploadedImageList: []
        });
        this.stopLoading();
      }.bind(this))
      .catch(function (err) {
        var errMsg = request.extractApiErrorMessage(err, '保存失败，请稍后重试');
        this.showApiError(errMsg);
        this.stopLoading();
      }.bind(this));
  },
  addFollowRecord: function (method, content, image) {
    var methodLabel = '短信邀约';
    if (method === 'call') {
      methodLabel = '外呼邀约';
    }
    if (method === 'wechat') {
      methodLabel = '微信邀约';
    }
    if (method === 'wecom') {
      methodLabel = '企微邀约';
    }

    var now = new Date();
    var dateText =
      now.getFullYear() +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(now.getDate()).padStart(2, '0') +
      ' · ' +
      String(now.getHours()).padStart(2, '0') +
      ':' +
      String(now.getMinutes()).padStart(2, '0');

    var item = {
      date: dateText,
      method: methodLabel,
      content: content,
      staff: '招揽员：张敏(邀约系统)',
      image: image || ''
    };

    this.setData({
      followRecords: [item].concat(this.data.followRecords)
    });
  }
});
