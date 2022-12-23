
import cloud from '@/cloud-sdk'
import * as querystring from 'querystring'
import * as crypto from 'crypto'
import * as assert from 'assert'

/**
 * @param ApiEntryPoint
 * @param AccessKeyId
 * @param AccessKeySecret
 * @params ...others
 */
exports.main = async function (ctx) {
  assert.ok(ctx.body, 'empty body got')

  const ApiEntryPoint = ctx.body.ApiEntryPoint
  const AccessKeySecret = ctx.body.AccessKeySecret

  const _params = Object.assign({
    Format: 'json',
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: crypto.randomUUID(),
    SignatureVersion: '1.0',
    Version: '2017-03-21',
    Timestamp: (new Date()).toISOString()
  }, ctx.body)

  delete _params['ApiEntryPoint']
  delete _params['AccessKeySecret']

  console.log(_params)
  const params = sortObjectKeys(_params)
  params['Signature'] = specialEncode(sign(params, AccessKeySecret))

  const query = querystring.stringify(params)

  const url = `${ApiEntryPoint}?${query}`

  console.log('=>', url)

  try {
    const r = await cloud.fetch(url)
    return r.data
  } catch (err) {
    console.log(err.response.data)
    throw err
  }
}

// 签名
function sign(raw_params: any, accessKeySecret: string) {
  const params = encode(raw_params)

  //拼接strToSign
  let strToSign = '';
  for (let i in params) {
    strToSign += i + '=' + params[i] + '&';
  }
  strToSign = strToSign.substr(0, strToSign.length - 1);
  strToSign = "GET&" + encodeURIComponent('/') + '&' + encodeURIComponent(strToSign);

  // 阿里云签名是要求 基于 hash 的原始二进制值 进行 base64编码
  const ret = crypto.createHmac('sha1', accessKeySecret + '&')
    .update(strToSign)
    .digest('base64')

  return ret
}

//对各个参数进行字典序升序排序
function sortObjectKeys(obj) {
  const tmp = {};
  Object.keys(obj).sort().forEach(k => tmp[k] = obj[k])
  return tmp;
}


//对排序之后的参数进行 uriencode + POP 编码
function encode(params) {
  const obj = {}
  //对urlencode之后的特殊字符进行替换
  for (let i in params) {
    const str = encodeURIComponent(params[i])
    obj[i] = specialEncode(str)
  }
  return obj
}

// 阿里云的特殊编码(POP编码)
function specialEncode(encoded) {
  if (encoded.indexOf('+')) {
    encoded.replace("+", "%20");
  } else if (encoded.indexOf('*')) {
    encoded.replace("*", "%2A");
  } else if (encoded.indexOf('%7E')) {
    encoded.replace("%7E", "~");
  }
  return encoded
}
