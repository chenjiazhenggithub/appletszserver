function OcrIdCard(access_token){
  return new Promise(function(resolve,reject){
    var that = this;
    //识别身份证
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        wx.showLoading({ title: '识别中' })
        wx.uploadFile({
          url: 'https://applet.myszgroup.cn:7779/api/UserPage/UploadAllValuesImgeByData?typenum=1', //仅为示例，非真实的接口地址
          filePath: res.tempFilePaths[0],
          name: 'appletimg',
          // header: {
          //   "Content-Type": "multipart/form-data",
          //   'accept': 'application/json',
          // },
          // formData: {
          //   typenum
          // },
          success (res){
            wx.hideLoading();
            const data = res.data
            resolve(data)
            //do something
          },fail(_res) {
            wx.hideLoading();
            wx.showToast({
                title: '请求出错',
            })
            reject(_res)
          }
        })
          //核心代码
        // wx.getFileSystemManager().readFile({
        //   filePath: res.tempFilePaths[0],
        //   encoding: 'base64', //编码格式
        //   success(ans) {
        //     console.log(ans.data)
        //     wx.showLoading({ title: '识别中' })
        //     wx.request({
        //       url: 'https://applet.myszgroup.cn:7779/api/UserPage/ScanIdCardData',
        //       method: 'POST',
        //       header: {
        //         'Content-Type': 'application/x-www-form-urlencoded'
        //       },
        //       data: {
        //         image: ans.data,
        //         id_card_side: 'front'
        //       },
        //       success(_res) {
        //         wx.hideLoading();
        //         resolve(_res)
                
        //       }, fail(_res) {
        //         wx.hideLoading();
        //         wx.showToast({
        //           title: '请求出错',
        //         })
        //         reject(_res)
        //       }
        //     })
        //   }
        // })
      }
    })
  })
}

function sacnimg(src){
  return new Promise(function(resolve,reject){
    var that = this;
    //识别二维码
    wx.uploadFile({
      url: 'https://applet.myszgroup.cn:7779/api/UserPage/QRcode', //仅为示例，非真实的接口地址
      filePath: src,
      name: 'appletimg',
      // header: {
      //   "Content-Type": "multipart/form-data",
      //   'accept': 'application/json',
      // },
      // formData: {
      //   typenum
      // },
      success (res){
        const data = res.data
        resolve(data)
        //do something
      },fail(_res) {
        wx.showToast({
            title: '请求出错',
        })
        reject(_res)
      }
    })
  })
}

module.exports = {
  OcrIdCard: OcrIdCard,
  sacnimg: sacnimg
}