import * as crypto from 'crypto'
import cloud from '@/cloud-sdk'

/**
 * @body username string 用户名，即手机号
 * @body password string 密码
 */

exports.main = async function (ctx: FunctionContext) {
  const db = cloud.database()

  // 参数验证
  const { username, password } = ctx.body
  if (!username || !password) {
    return { code: 'INVALID_PARAM', error: '用户名或密码不可为空' }
  }

  // 验证用户名与密码是否正确
  const { data: user } = await db.collection('biz_user')
    .where({
      username,
      password: hashPassword(password)
    })
    .getOne()

  if (!user)
    return { code: 'INVALID_PARAM', error: '用户名或密码不正确' }

  // 默认 token 有效期为 7 天
  const expire = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
  const access_token = cloud.getToken({
    uid: user._id,
    exp: expire
  })

  delete user['password']

  return {
    code: 0,
    data: { access_token, user, expire }
  }
}

/**
 * @param {string} content
 * @return {string}
 */
function hashPassword(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex')
}

