//index.js
//获取应用实例
const app = getApp()
const request = require('../../utils/request')
const config = require('../../utils/config')

Page({
  data: {
    motto: '我的权限',
    name: '',
    UserName: '',
    userInfo: {},
    menulist: [
      {
        title: '客户办卡',
        iamge: './images/kehubanka.png',
  src: '/subpackages/member/customer-card/customer-card',
        class: 'twomenu-image',
        role: 514,
        show: false,
        index: 1
      },
      {
        title: '客户信息查询',
        iamge: './images/customer.png',
        src: '/subpackages/member/customer-info/customer-info',
        class: 'twomenu-image1',
        role: 700,
        show: false,
        index: 8
      },
      {
        title: '员工卡劵中心',
        iamge: './images/card-center.png',
  src: '/subpackages/member/card-center/card-center',
        class: 'twomenu-image4',
        role: 9999,
        show: false,
        index: 5
      },{
        title: '待核销明细',
        iamge: './images/card-center.png',
  src: '/subpackages/member/verification-details/verification-details',
        class: 'twomenu-image4',
        role: 516,
        show: false,
        index: 6
      },{
        title: '消费结账',
        iamge: './images/xiaofeijiezhang.png',
        src: '/pages/consumption-checkout/consumption-checkout',
        class: 'twomenu-image1',
        role: 513,
        show: false,
        index: 2
      },{
        title: '会员查询',
        iamge: './images/customer.png',
  src: '/subpackages/member/member-inquiry/member-inquiry',
        class: 'twomenu-image1',
        role: 515,
        show: false,
        index: 3
      },
      {
        title: '核销历史',
        iamge: './images/history.png',
  src: '/subpackages/member/history/history',
        class: 'twomenu-image1',
        role: 513,
        show: false,
        index: 4
      },
      {
        title: '修改密码',
        iamge: './images/passlogo.png',
  src: '/subpackages/member/password/password',
        class: 'twomenu-image5',
        role: 9999,
        show: false,
        index: 7
      },
      // {
      //   title: '识别证件',
      //   iamge: './images/xiaofeijiezhang.png',
      //   src: '/pages/Identification/Identification',
      //   class: 'twomenu-image1',
      //   role: 515,
      //   show: false,
      //   index: 4
      // }
    ],
    logonInfo: {},
    powerModel: [],
    hasUserInfo: false,
    first: true,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  //事件处理函数

  onLoad: function () {
    var that = this
    app.neelogon().then(res => {
        if (app.page === '') {
          // app.logon().then(dandianres => {
          //   if (app.page === '') {

          //   } else {
          //     that.getdiandata()
          //   }
          // })
        } else {
          if (app.page === '集团登录') {
            if (app.jituanname) {
              that.setData({
                name: app.jituanname,
                UserName: app.globalData.UserName
              })
            } else {
                app.userJituannameCallback = res => {
                  that.setData({
                    name: res.data.result_data.StoreName,
                    UserName: es.data.result_data.UserName
                  })
                }
            }
            if (app.jituanuserId !== null) {
              const arr = [513]
              that.roleshow(arr)
            }
          } else {
            that.getdiandata()
          }
        }
    })
  },
  getdiandata () {
    const that = this
    const eventChannel = this.getOpenerEventChannel()
    if (JSON.stringify(eventChannel) === '{}') {
      that.roleshow(app.globalData.powerModel)
      if (app.isshowrole === true) {
        that.setData({
          name: app.globalData.storename,
          UserName: app.globalData.UserName
        })
      }
    } else if (JSON.stringify(eventChannel) === '{"listener":{}}') {
      if (app.isshowrole === false) {
        eventChannel.on('acceptDataFromOpenerPage', function(data) {
          that.logonInfo = data.data1
          app.globalData.StoreId = data.data1.StoreId
          app.globalData.ClassName = data.data1.ClassName
          app.globalData.UserId = data.data1.UserId
          app.globalData.powerModel = data.data1.powerModel
          app.globalData.storename = data.data1.StoreName
          app.globalData.UserName = data.data1.UserName
          app.globalData.UserNo = data.data1.UserNo
          that.setData({
            name: data.data1.StoreName,
            UserName: data.data1.UserName,
            powerModel: data.data1.powerModel,
          })
          that.roleshow(data.data1.powerModel)
          app.isshowrole = true
        })
      } else {
        that.roleshow(app.globalData.powerModel)
      }
    } else {
      eventChannel.on('acceptDataFromOpenerPage', function(data) {
        that.logonInfo = data.data1
        app.globalData.StoreId = data.data1.StoreId
        app.globalData.ClassName = data.data1.ClassName
        app.globalData.UserId = data.data1.UserId
        app.globalData.UserNo = data.data1.UserNo
        that.setData({
          name: data.data1.StoreName,
          UserName: data.data1.UserName,
          powerModel: data.data1.powerModel,
        })
        that.roleshow(data.data1.powerModel)
      })
    }
    if (app.globalData.userInfo) {
      that.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (that.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        that.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          that.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
    if (app.globalData.storename) {
      that.setData({
        name: app.globalData.storename,
        UserName: app.globalData.UserName,
        powerModel: app.globalData.powerModel,
        hasUserInfo: true
      })
    } else {
        app.userStorenameCallback = res => {
          if (app.isfirst === false) {
            app.globalData.UserNo = res.data.result_data.UserNo
            that.roleshow(app.globalData.powerModel)
            that.setData({
              name: res.data.result_data.StoreName,
              UserName: res.data.result_data.UserName,
              powerModel: app.globalData.powerModel,
              hasUserInfo: true
            })
          }
        }
    }
  },
  onHide: function() {
    if (app.page === '集团登录') {

    } else {
      this.first = false
    }
  },
  onShow: function () {
    console.log(app.page)
    if (app.page === '集团登录') {
      app.neelogon()
    } else {
      if (this.first === false) {
        app.logon()
      }
    }
  },
  getUserInfo: function(e) {
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  console:function(event) {
  },
  roleshow: function(arr) {
    var that = this
    that.data.menulist.forEach((i,index) => {
      if (i.title === '客户信息查询') {
        if (app.page !== '单店登录' || !arr.includes(700)) {
          that.setData({
            ['menulist[' + index + '].show']: false
          })
          return
        }
      }
      if (arr.includes(i.role)) {
        // let show = that.data.menulist[0].towmenu[index].show
        that.setData({
          ['menulist[' + index + '].show']: true
        })
      }
      if (app.page === '单店登录') {
        if (arr.includes(513)) {
          if (i.title === '核销历史') {
            that.setData({
              ['menulist[' + index + '].show']: false
            })
          }
        }
        if (app.globalData.CardId !== '' && app.globalData.CardId !== null) {
          if (i.title === '员工卡劵中心') {
            that.setData({
              ['menulist[' + index + '].show']: true
            })
          }
        }
      } else {
        if (i.title === '修改密码') {
          that.setData({
            ['menulist[' + index + '].show']: true
          })
        }
      }
    })
  },
  logBtn: function(e) {
      var that = this
      that.data.logonInfo.ClassName = app.globalData.ClassName
      that.data.logonInfo.UserId = app.globalData.UserId
      that.data.logonInfo.StoreId = app.globalData.StoreId
      that.data.logonInfo.UserNo = app.globalData.UserNo 
      if (e.currentTarget.dataset.src === '/pages/consumption-checkout/consumption-checkout') {
        wx.scanCode({
          success (coderes) {
            wx.login({
              success: item => {
                if (app.page) {
                  if (app.page === '集团登录') {
                    request.authRequest({
                      url: config.API_BASE_URL + '/api/UserPage/AppHxScanBefore',
                      method: 'POST',
                      header: {
                        'content-type': 'application/json' 
                      },
                      data: {
                        code: coderes.result,
                        userid: app.jituanuserId
                      },
                      success: function(res) {
                        if (res.data.result_code === '0') {
                          if (res.data.result_data) {
                            let tishiname = ''
                            let tishiRegisterno = ''
                            if (res.data.result_data.NewName !== null && res.data.result_data.NewName !== '') {
                              tishiname = res.data.result_data.NewName
                            } else {
                              tishiname = res.data.result_data.cname
                            }
                            if (res.data.result_data.UseRegisterno !== null && res.data.result_data.UseRegisterno !== '') {
                              tishiRegisterno = res.data.result_data.UseRegisterno
                            } else {
                              tishiRegisterno = res.data.result_data.CarNo
                            }
                            wx.showModal({
                              title: '优惠项提示',
                              content: `使用车牌号：${tishiRegisterno}，\r\n此次核销项目为：【${tishiname}】是否确认核销？`,
                              success (modalres) {
                                if (modalres.confirm) {
                                  request.authRequest({
                                    url: config.API_BASE_URL + '/api/UserPage/AppHxScanLogin',
                                    method: 'POST',
                                    header: {
                                      'content-type': 'application/json' 
                                    },
                                    data: {
                                      code: res.data.result_data.code,
                                      account: res.data.result_data.account,
                                      classname: res.data.result_data.classname,
                                      cname: res.data.result_data.cname,
                                      userid: app.jituanuserId,
                                      hxWay: 1,
                                      bICouponTypeName: res.data.result_data.bICouponTypeName,
                                      NewName: res.data.result_data.NewName,
                                      PayMoney: res.data.result_data.PayMoney,
                                      UseRegisterno: res.data.result_data.UseRegisterno,
                                      UseName: res.data.result_data.UseName,
                                      UseBrand: res.data.result_data.UseBrand,
                                      UseMobile: res.data.result_data.UseMobile,
                                      PresentLogId: res.data.result_data.PresentLogId,
                                      scanstr: coderes.result
                                    },
                                    success: function(requestres) {
                                      if (requestres.data.result_code === '0') {
                                        if (requestres.data.result_data > 0) {
                                          wx.showModal({
                                            title: '提示',
                                            content: `核销成功，\r\n使用车牌号：${tishiRegisterno},\r\n核销项目：【${tishiname}】`,
                                            showCancel: false
                                          })
                                        } else {
                                          wx.showModal({
                                            content: requestres.data.result_msg,
                                            showCancel: false
                                          })
                                        }
                                      } else {
                                        wx.showModal({
                                          content: requestres.data.result_msg,
                                          showCancel: false
                                        })
                                      }
                                    }
                                  })
                                } else if (modalres.cancel) {
                                }
                              }
                            })
                          } else {
                            wx.showModal({
                              content: res.data.result_msg,
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
                      fail: function(erroe){
                        wx.showModal({
                          content: erroe,
                          showCancel: false
                        })
                      }            
                    })
                  } else {
                    // wx.request({
                    //   url: config.API_BASE_URL + '/api/UserPage/AppHxScanBefore',
                    //   method: 'POST',
                    //   header: {
                    //     'content-type': 'application/json' 
                    //   },
                    //   data: {
                    //     code: coderes.result,
                    //     userid: app.globalData.UserId
                    //   },
                    //   success: function(res) {
                    //     if (res.data.result_code === '0') {
                    //       if (res.data.result_data) {
                    //         let tishiname = ''
                    //         let tishiRegisterno = ''
                    //         if (res.data.result_data.NewName !== null && res.data.result_data.NewName !== '') {
                    //           tishiname = res.data.result_data.NewName
                    //         } else {
                    //           tishiname = res.data.result_data.cname
                    //         }
                    //         if (res.data.result_data.UseRegisterno !== null && res.data.result_data.UseRegisterno !== '') {
                    //           tishiRegisterno = res.data.result_data.UseRegisterno
                    //         } else {
                    //           tishiRegisterno = res.data.result_data.CarNo
                    //         }
                    //         wx.showModal({
                    //           title: '优惠项提示',
                    //           content: `使用车牌号：${tishiRegisterno}，\r\n此次核销项目为：【${tishiname}】是否确认核销？`,
                    //           success (modalres) {
                    //             if (modalres.confirm) {
                    //               wx.request({
                    //                 url: config.API_BASE_URL + '/api/UserPage/AppHxScanLogin',
                    //                 method: 'POST',
                    //                 header: {
                    //                   'content-type': 'application/json' 
                    //                 },
                    //                 data: {
                    //                   code: res.data.result_data.code,
                    //                   account: res.data.result_data.account,
                    //                   classname: res.data.result_data.classname,
                    //                   cname: res.data.result_data.cname,
                    //                   userid: app.jituanuserId,
                    //                   hxWay: 1,
                    //                   bICouponTypeName: res.data.result_data.bICouponTypeName,
                    //                   NewName: res.data.result_data.NewName,
                    //                   PayMoney: res.data.result_data.PayMoney,
                    //                   UseRegisterno: res.data.result_data.UseRegisterno,
                    //                   UseName: res.data.result_data.UseName,
                    //                   UseBrand: res.data.result_data.UseBrand,
                    //                   UseMobile: res.data.result_data.UseMobile,
                    //                   PresentLogId: res.data.result_data.PresentLogId,
                    //                   scanstr: coderes.result
                    //                 },
                    //                 success: function(requestres) {
                    //                   if (requestres.data.result_code === '0') {
                    //                     if (requestres.data.result_data > 0) {
                    //                       wx.showModal({
                    //                         title: '提示',
                    //                         content: `核销成功，\r\n使用车牌号：${tishiRegisterno},\r\n核销项目：【${tishiname}】`,
                    //                         showCancel: false
                    //                       })
                    //                     } else {
                    //                       wx.showModal({
                    //                         content: requestres.data.result_msg,
                    //                         showCancel: false
                    //                       })
                    //                     }
                    //                   } else {
                    //                     wx.showModal({
                    //                       content: requestres.data.result_msg,
                    //                       showCancel: false
                    //                     })
                    //                   }
                    //                 }
                    //               })
                    //             } else if (modalres.cancel) {
                    //             }
                    //           }
                    //         })
                    //       } else {
                    //         wx.showModal({
                    //           content: res.data.result_msg,
                    //           showCancel: false
                    //         })
                    //       }
                    //     } else {
                    //       wx.showModal({
                    //         content: res.data.result_msg,
                    //         showCancel: false
                    //       })
                    //     }
                    //   },
                    //   fail: function(erroe){
                    //     wx.showModal({
                    //       content: erroe,
                    //       showCancel: false
                    //     })
                    //   }            
                    // })
                    request.authRequest({
                      url: config.API_BASE_URL + '/api/UserPage/dodecfav_wechat',
                      method: 'POST',
                      header: {
                        'content-type': 'application/json' 
                      },
                      data: {
                        cardid_detail: coderes.result,
                        classname: app.globalData.ClassName,
                        UserNo: app.globalData.UserNo
                      },
                      success: function(res) {
                        if (res.data.result_code === '0') {
                          wx.showModal({
                            content: res.data.result_msg,
                            showCancel: false
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
                          content: erroe,
                          showCancel: false
                        })
                      }            
                    })
                  }
                } 
              }
            })
          }
        })
      } else {
        if (e.currentTarget.dataset.src === '/pages/Identification/Identification') {
          // wx.chooseMessageFile({
          //   count: 1,
          //   type: "image", //all,video,image,file
          //   success:(res)=> {
          //     console.log(res);
          //   },
          // });
        } else {
          wx.navigateTo({
            url: e.currentTarget.dataset.src,
            success: function(data) {
              // 通过eventChannel向被打开页面传送数据
              data.eventChannel.emit('acceptDataFromOpenerPage', { data1: that.data.logonInfo })
            }
          })
        }
      }
  },
  cancellation: function(e) {
    var that = this
    wx.showModal({
      title: '提示',
      content: '确认注销当前用户？',
      success: function(user) {
        if (user.confirm === true) {
          wx.login({
            success: item => {
              let url = ''
              let params = {}
              if (app.page === '集团登录') {
                params.Model = item.code
                url = config.API_BASE_URL + '/api/UserPage/AppHxLogOut'
              } else {
                url = config.API_BASE_URL + '/api/UserPage/LogOut'
                params.code = item.code
              }
              request.authRequest({
                url: url,
                method: 'POST',
                header: {
                  'content-type': 'application/json'
                },
                data: params,
                complete: function() {
                  // 退出登录接口调用后清除本地 Token（接口本身免 Token）
                  request.clearAuthToken()
                },
                success: function(res) {
                  if (res.data.result_code === '0') {
                    if (typeof app.clearLoginState === 'function') {
                      app.clearLoginState()
                    }
                    that.setData({
                      name: '',
                      UserName: '',
                      powerModel: [],
                      logonInfo: {},
                      hasUserInfo: false
                    })
                    wx.showToast({
                      title: '注销成功',
                      icon: 'success',
                      duration: 3000
                    })
                    wx.reLaunch({
                      url: '/pages/scan/scan'
                    })
                  } else {
                    wx.showToast({
                      title: res.data.result_msg || '注销失败',
                      icon: 'none',
                    })
                  }
                },
                fail: function(erroe){
                  wx.showToast({
                    title: (erroe && erroe.errMsg) ? erroe.errMsg : '注销失败',
                    icon: 'none',
                  })
                }
              })
            }
          })
        }
      }
    })
  }
})
