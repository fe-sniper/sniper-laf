
import cloud from '@/cloud-sdk'

/**
 * @body username string 用户名，即手机号
 * @body code number 验证码
 * 
 * 1. 验证码检查
 * 2. 用户不存在则为注册，并登录
 * 3. 用户存在，则直接完成登录
 * 4. 使验证码失效
 */

exports.main = async function (ctx: FunctionContext) {
  const db = cloud.database()

  // 参数验证
  let { username, code } = ctx.body
  if (!username || !code) {
    return { code: 'INVALID_PARAM', error: '用户名或验证码不可为空' }
  }

  code = parseInt(code)
  console.log(ctx.body)

  // 验证码是否正确
  const { total } = await db.collection('sys_sms_history')
    .where({
      phone: username,
      code: code,
      type: 'login',
      status: 1,
      created_at: db.command.gte(Date.now() - 10 * 60 * 1000)
    })
    .count()

  console.log(total, 'total')
  if (total === 0) {
    return { code: 'INVALID_CODE', error: '无效的验证码' }
  }

  let { data: user } = await db.collection('users')
    .where({ phone: username })
    .getOne()

  // 若用户不存在，则注册并完成登录
  if (!user) {
    const { id } = await db.collection('users')
      .add({
        nickname: username,
        username,
        phone: username,
        created_at: new Date(),
        updated_at: new Date()
      })

    const r = await db.collection('users').where({ _id: id }).getOne()
    user = r.data
  }

  // 使验证码失效
  await db.collection('sys_sms_history')
    .where({
      phone: username,
      code,
      type: 'login'
    })
    .update({
      status: 0
    })

  delete user['password']

  // 默认 token 有效期为 7 天
  const expire = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
  const access_token = cloud.getToken({
    uid: user._id,
    exp: expire,
  })

  return {
    code: 0,
    data: { access_token, user, expire }
  }
}