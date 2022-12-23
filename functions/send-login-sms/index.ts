
import cloud from '@/cloud-sdk'
const db = cloud.database()

/**
 * 发送登陆短信验证码：调用发短信的云函数。
 * check list:
 * 1. 检查手机号是否合法
 * 2. 检查手机号1分钟之内是否已发送过
 * 3. 检查手机号发送频率是否超限（30次/24小时）
 * 4. 发送验证码
 */
exports.main = async function (ctx: FunctionContext) {
  const { phone, codeType } = ctx.body

  // 1. 检查手机号是否合法
  if (!(/^1[3456789]\d{9}$/.test(phone)))
    return { code: 'INVALID_PHONE', error: '手机号码有误' }

  // 检查手机号是否已注册
  {
    const { total } = await db.collection('users').where({ phone }).count()
    if (total > 0) return { code: 'ALREADY_EXISTS', error: '该手机号已经被其它账户绑定' }
  }

  // 2. 检查手机号1分钟之内是否已发送过
  {
    const query = {
      phone,
      created_at: db.command.gt(Date.now() - 60 * 1000)
    }
    const { total } = await db.collection('sys_sms_history')
      .where(query)
      .count()

    console.log('1min', { phone, total })
    if (total > 0) return { code: 'REQUEST_OVERLIMIT', error: '短信发送过于频繁：1分钟后尝试' }
  }

  // 3. 检查手机号发送频率是否超限（30次/24小时）
  {
    const query = {
      phone,
      created_at: db.command.gt(Date.now() - 24 * 60 * 60 * 1000)
    }
    const { total } = await db.collection('sys_sms_history')
      .where(query)
      .count()

    console.log('24h', { phone, total })
    if (total > 30) return { code: 'REQUEST_OVERLIMIT', error: '短信发送过于频繁：24小时之内只能发送30次' }
  }

  // 4. 发送验证码
  const code = Math.floor(Math.random() * 9000) + 1000
  const ret = await cloud.invoke('aliyun-sms-service', { body: { phone, code } })
  if (ret.code !== 0) return { code: ret.code, error: '短信发送失败', data: ret }

  // 5. 保存记录
  await db.collection('sys_sms_history')
    .add({
      phone,
      code,
      type: codeType ?? 'login',
      status: 1,
      created_at: Date.now()
    })

  console.log({ phone, code })
  return { code: 0, data: 'success' }
}
