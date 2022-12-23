
import cloud from '@/cloud-sdk'

/**
 * @body phone string 手机号
 * @body code string | number 验证码
 */
exports.main = async function (ctx) {
  // 加载短信配置
  const config = await loadAliSmsConfigs()

  const phone = ctx.body?.phone
  if (!phone) {
    return { code: 'INVALID_PARAM', error: 'invalid phone' }
  }
  const code = ctx.body?.code
  if (!code) {
    return { code: 'INVALID_PARAM', error: 'invalid code' }
  }

  const params = {
    AccessKeyId: config.accessKeyId,
    AccessKeySecret: config.accessKeySecret,
    ApiEntryPoint: config.api_entrypoint,
    Action: 'SendSms',
    Version: '2017-05-25',
    PhoneNumbers: phone,
    SignName: config.signName,
    TemplateCode: config.templateCode,
    TemplateParam: `{"code": ${code}}`
  }

  const data = await cloud.invoke('invoke-aliyun-api', { body: params })
  console.log(data)

  return {
    code: 0,
    data: data
  }
}



/**
 * 加载阿里云短信配置
 */
async function loadAliSmsConfigs() {
  const db = cloud.database()
  const { data: config } = await db.collection('sys_config')
    .where({ key: 'alisms' })
    .getOne()

  const value = config?.value

  if (!value) {
    throw new Error('加载短信配置失败，是否配置？')
  }

  return {
    accessKeyId: value?.accessKeyId,          // 阿里云访问 Key ID
    accessKeySecret: value?.accessKeySecret,  // 阿里云访问 Key Secret
    api_entrypoint: value?.api_entrypoint ?? 'https://dysmsapi.aliyuncs.com',
    signName: value?.signName,          // 短信签名，修改为你的签名，如: "灼灼信息"
    templateCode: value?.templateCode   // 短信模板ID，如 'SMS_217850726'
  }
}