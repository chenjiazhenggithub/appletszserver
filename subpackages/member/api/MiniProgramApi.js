const request = require('../../../utils/request');

const BASE_URL = 'https://szbk.bjcls.cn:7718'; // http://47.95.203.61:7718

function searchVehicleForSelect(params) {
  var data = params || {};

  return request.requestApi({
    url: BASE_URL + '/api/MiniProgramApi/SearchVehicleForSelect',
    method: 'GET',
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: data
  });
}

function getVehicleMemberProfile(params) {
  var data = params || {};

  return request.requestApi({
    url: BASE_URL + '/api/MiniProgramApi/GetVehicleMemberProfile',
    method: 'GET',
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: data
  });
}

function getInvitationHistory(params) {
  var data = params || {};

  return request.requestApi({
    url: BASE_URL + '/api/MiniProgramApi/GetInvitationHistory',
    method: 'GET',
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: data
  });
}

function getMemberCouponsByVehicle(params) {
  var data = params || {};

  return request.requestApi({
    url: BASE_URL + '/api/MiniProgramApi/GetMemberCouponsByVehicle',
    method: 'GET',
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: data
  });
}

function getComplaintListByVehData(params) {
  var data = params || {};

  return request.requestApi({
    url: BASE_URL + '/api/MiniProgramApi/GetComplaintListByVehData',
    method: 'GET',
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: data
  });
}

function addInvitation(params) {
  var data = params || {};
  var serviceGroupId =
    data.serviceGroupId !== undefined && data.serviceGroupId !== null
      ? data.serviceGroupId
      : data.ServiceGroupId;
  var requestData = Object.assign({}, data);

  return request.requestApi({
    url:
      BASE_URL +
      '/api/MiniProgramApi/AddInvitation?serviceGroupId=' +
      encodeURIComponent(serviceGroupId === undefined || serviceGroupId === null ? '' : String(serviceGroupId)),
    method: 'POST',
    header: {
      'Content-Type': 'application/json'
    },
    data: requestData
  });
}

function addMemberInfo(params) {
  var data = params || {};
  var serviceGroupId = data.serviceGroupId;
  var vehicleId = data.vehicleId;

  return request.requestApi({
    url:
      BASE_URL +
      '/api/MiniProgramApi/AddMemberInfo?serviceGroupId=' +
      encodeURIComponent(serviceGroupId === undefined || serviceGroupId === null ? '' : String(serviceGroupId)) +
      '&vehicleId=' +
      encodeURIComponent(vehicleId === undefined || vehicleId === null ? '' : String(vehicleId)),
    method: 'POST',
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: {}
  });
}

function uploadImportImage(params) {
  var data = params || {};
  var serviceGroupId = data.serviceGroupId;
  var storeId = data.storeId;
  var filePath = data.filePath;

  return request.safeUploadFile({
    url:
      BASE_URL +
      '/api/Import/ImportImage?serviceGroupId=' +
      encodeURIComponent(serviceGroupId === undefined || serviceGroupId === null ? '' : String(serviceGroupId)) +
      '&storeId=' +
      encodeURIComponent(storeId === undefined || storeId === null ? '' : String(storeId)),
    filePath: filePath,
    name: 'file'
  }).then(function (res) {
    var body = res && typeof res.data !== 'undefined' ? res.data : {};

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return Promise.reject(new Error('上传接口返回非 JSON 数据'));
      }
    }

    var hasStandardCode = body && Object.prototype.hasOwnProperty.call(body, 'result_code');
    var hasStandardSuccess = body && Object.prototype.hasOwnProperty.call(body, 'is_success');

    if (!hasStandardCode && !hasStandardSuccess) {
      return body;
    }

    if (body.result_code === '0' || body.result_code === 0 || body.is_success === true) {
      return body;
    }

    return Promise.reject(new Error(request.extractApiErrorMessage(body, '图片上传失败')));
  });
}

module.exports = {
  searchVehicleForSelect,
  getVehicleMemberProfile,
  getInvitationHistory,
  getMemberCouponsByVehicle,
  getComplaintListByVehData,
  addInvitation,
  addMemberInfo,
  uploadImportImage
};
