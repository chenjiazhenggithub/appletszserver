const request = require('../../../utils/request');

const BASE_URL = 'https://szbk.bjcls.cn:7718'; // http://47.95.203.61:7718  //https://szbk.bjcls.cn:7718
const FORDJOIN_BASE_URL = 'https://szbk.bjcls.cn:5123';
const DEEPSEEK_DEFAULT_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const DEEPSEEK_DEFAULT_MODEL = 'deepseek-v3';
const DEEPSEEK_DEFAULT_API_KEY = 'sk-04c2193aa7c3476e849acf63b7eaa720';

function toText(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

function buildUsedCarPricePrompt(profile) {
  var data = profile && typeof profile === 'object' ? profile : {};
  var fordLatestMileage = toText(data.fordLatestMileage);
  var insuranceItems = Array.isArray(data.commercialInsuranceItems)
    ? data.commercialInsuranceItems
    : [];
  var insuranceSummary = insuranceItems
    .map(function (item) {
      var name = toText(item && item.name);
      var amountText = toText(item && item.amountText);
      if (!name && !amountText) {
        return '';
      }
      if (!name) {
        return amountText;
      }
      if (!amountText) {
        return name;
      }
      return name + ':' + amountText;
    })
    .filter(function (item) {
      return !!item;
    })
    .join('；');

  return [
    '请基于以下车辆信息，估算该车当前二手车市场收购价格。',
    '请严格只输出一个数字（单位元），不要输出任何文字、单位、解释或符号。',
    '如果你判断应返回价格区间，请取区间最低值，并仅输出该最低值整数。',
    '',
    '车辆信息：',
    'brand: ' + (toText(data.brand) || '--'),
    'series: ' + (toText(data.series) || '--'),
    'model: ' + (toText(data.model) || '--'),
    'vin: ' + (toText(data.vin) || '--'),
    'number: ' + (toText(data.number) || '--'),
    'vehicleModelYear: ' + (toText(data.vehicleModelYear) || '--'),
    'buyCarDate: ' + (toText(data.buyCarDate) || '--'),
    'vehicleAgeText: ' + (toText(data.vehicleAgeText) || '--'),
    'lateSTMILEAGE: ' + (fordLatestMileage || '--'),
    'color: ' + (toText(data.color) || '--'),
    'commercialInsuranceRemainingText: ' + (toText(data.commercialInsuranceRemainingText) || '--'),
    'commercialInsuranceItems: ' + (insuranceSummary || '--')
  ].join('\n');
}

function getFordBaseCustomerByVin(params) {
  var data = params || {};

  return request.requestApi({
    url: FORDJOIN_BASE_URL + '/api/fordjoin/GetBaseCustomerByVin',
    method: 'GET',
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: {
      brand: 'Ford',
      vin: data.vin,
      serviceGroupId: data.serviceGroupId
    }
  });
}

function parseEstimatePrice(rawText) {
  var text = toText(rawText);
  if (!text) {
    return null;
  }

  var wanMatched = text.match(/(\d[\d,]*(?:\.\d+)?)\s*(万|w|W)/);
  if (wanMatched) {
    var wanNum = Number(String(wanMatched[1]).replace(/,/g, ''));
    if (Number.isFinite(wanNum)) {
      return Math.round(wanNum * 10000);
    }
  }

  var matched = text.match(/\d[\d,]*(?:\.\d+)?/);
  if (!matched) {
    return null;
  }

  var num = Number(String(matched[0]).replace(/,/g, ''));
  if (!Number.isFinite(num)) {
    return null;
  }

  return Math.round(num);
}

function clampPrice(value) {
  var num = Number(value);
  if (!Number.isFinite(num)) {
    return 50000;
  }

  var rounded = Math.round(num / 100) * 100;
  if (rounded < 8000) {
    return 8000;
  }
  if (rounded > 500000) {
    return 500000;
  }
  return rounded;
}

function extractDeepseekMessageText(body) {
  var bailianChoice =
    body && body.output && body.output.choices && body.output.choices[0] ? body.output.choices[0] : null;
  var bailianMessage =
    bailianChoice && bailianChoice.message && typeof bailianChoice.message === 'object'
      ? bailianChoice.message
      : null;

  if (bailianMessage && typeof bailianMessage.content === 'string') {
    return bailianMessage.content;
  }

  if (bailianMessage && Array.isArray(bailianMessage.content)) {
    var bailianJoined = bailianMessage.content
      .map(function (item) {
        if (typeof item === 'string') {
          return item;
        }
        if (!item || typeof item !== 'object') {
          return '';
        }
        if (typeof item.text === 'string') {
          return item.text;
        }
        if (typeof item.content === 'string') {
          return item.content;
        }
        return '';
      })
      .filter(function (item) {
        return !!item;
      })
      .join('\n');

    if (bailianJoined) {
      return bailianJoined;
    }
  }

  if (body && body.output && typeof body.output.text === 'string') {
    return body.output.text;
  }

  var choice = body && body.choices && body.choices[0] ? body.choices[0] : {};
  var message = choice && choice.message && typeof choice.message === 'object' ? choice.message : {};
  var content = message.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    var joined = content
      .map(function (item) {
        if (typeof item === 'string') {
          return item;
        }
        if (!item || typeof item !== 'object') {
          return '';
        }
        if (typeof item.text === 'string') {
          return item.text;
        }
        if (typeof item.content === 'string') {
          return item.content;
        }
        return '';
      })
      .filter(function (item) {
        return !!item;
      })
      .join('\n');

    if (joined) {
      return joined;
    }
  }

  if (content && typeof content === 'object') {
    if (typeof content.text === 'string') {
      return content.text;
    }
    if (typeof content.content === 'string') {
      return content.content;
    }
  }

  if (typeof message.reasoning_content === 'string') {
    return message.reasoning_content;
  }

  return '';
}

function callDeepseekChat(params) {
  var endpoint = toText(params && params.endpoint) || DEEPSEEK_DEFAULT_ENDPOINT;
  var apiKey = toText(params && params.apiKey);
  var model = toText(params && params.model) || DEEPSEEK_DEFAULT_MODEL;
  var messages = Array.isArray(params && params.messages) ? params.messages : [];
  var temperatureRaw = Number(params && params.temperature);
  var maxTokensRaw = Number(params && params.maxTokens);

  var requestData = {
    model: model,
    temperature: Number.isFinite(temperatureRaw) ? temperatureRaw : 0,
    messages: messages
  };

  if (Number.isFinite(maxTokensRaw) && maxTokensRaw > 0) {
    requestData.max_tokens = Math.floor(maxTokensRaw);
  }

  return new Promise(function (resolve, reject) {
    wx.request({
      url: endpoint,
      method: 'POST',
      timeout: 12000,
      header: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      data: requestData,
      success: function (res) {
        if (!res || (res.statusCode !== 200 && res.statusCode !== 201)) {
          var statusCode = res && res.statusCode ? String(res.statusCode) : '0';
          var errBody = res && typeof res.data !== 'undefined' ? res.data : '';
          return reject(new Error('百炼请求失败(' + statusCode + ') ' + toText(typeof errBody === 'string' ? errBody : JSON.stringify(errBody))));
        }

        resolve(res.data || {});
      },
      fail: function (err) {
        reject(new Error(request.extractApiErrorMessage(err, '百炼请求失败')));
      }
    });
  });
}

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

function estimateUsedCarPurchasePrice(params) {
  var data = params || {};
  var profile = data.profile && typeof data.profile === 'object' ? data.profile : {};
  var apiKey = DEEPSEEK_DEFAULT_API_KEY;
  var endpoint = DEEPSEEK_DEFAULT_ENDPOINT;
  var model = DEEPSEEK_DEFAULT_MODEL;

  if (!apiKey) {
    return Promise.reject(new Error('未配置DeepSeek API Key'));
  }

  var prompt = buildUsedCarPricePrompt(profile);

  function requestAndParse(messages) {
    return callDeepseekChat({
      endpoint: endpoint,
      apiKey: apiKey,
      model: model,
      temperature: 0,
      messages: messages
    }).then(function (body) {
      var content = extractDeepseekMessageText(body);
      var price = parseEstimatePrice(content);
      return {
        price: price,
        content: content
      };
    });
  }

  function buildRetryMessages(round) {
    var hardLine = '你必须只输出一个整数价格（单位元），不能输出解释、换行、单位、符号或空字符串。如果判断应为区间价格，必须取区间最低值并只输出该最低值整数。';
    if (round >= 3) {
      hardLine += ' 如果信息不足，也必须给出保守估值整数。';
    }

    return [
      {
        role: 'system',
        content: '你是二手车估值助手。' + hardLine
      },
      {
        role: 'user',
        content: prompt + '\n\n再次强调：只返回一个整数；若估值是区间，取最低值后再返回，例如 50000-70000 时只返回 50000。'
      }
    ];
  }

  function tryEstimateWithRetry(maxRetry) {
    var lastContent = '';

    function run(round) {
      return requestAndParse(buildRetryMessages(round))
        .then(function (result) {
          lastContent = result.content;

          if (Number.isFinite(result.price)) {
            return {
              price: clampPrice(result.price),
              content: result.content,
              fallbackUsed: false
            };
          }

          if (round >= maxRetry) {
            return {
              price: null,
              content: lastContent
            };
          }

          return run(round + 1);
        })
        .catch(function () {
          if (round >= maxRetry) {
            return {
              price: null,
              content: lastContent
            };
          }

          return run(round + 1);
        });
    }

    return run(1);
  }

  return tryEstimateWithRetry(5).then(function (result) {
    var normalizedPrice = Number.isFinite(result.price) ? result.price : '';
    var resultData = {
      usedCarPurchasePrice: normalizedPrice,
      estimateText: normalizedPrice === '' ? '' : String(normalizedPrice),
      rawText: toText(result.content)
    };

    return {
      result_code: '0',
      result_data: resultData
    };
  });
}

module.exports = {
  searchVehicleForSelect,
  getVehicleMemberProfile,
  getFordBaseCustomerByVin,
  getInvitationHistory,
  getMemberCouponsByVehicle,
  getComplaintListByVehData,
  addInvitation,
  addMemberInfo,
  uploadImportImage,
  estimateUsedCarPurchasePrice
};
