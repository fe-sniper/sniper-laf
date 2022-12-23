

import cloud from '@/cloud-sdk'
import * as crypto from 'crypto'

exports.main = async function (ctx: FunctionContext) {
  const db = cloud.database()

  const { username, password } = ctx.body
  if (!username || !password)
    return { code: 'INVALID_PARAM', error: "账号和密码不可为空" }

  const { data: admin} = await db.collection('admins')
    .where({ username, password: hashPassword(password) })
    .getOne()

  if (!admin)
    return { code: 'INVALID_PARAM', error: "账号或密码错误" }

  // 默认 token 有效期为 7 天
  const expire = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
  const payload = {
    uid: admin._id,
    type: 'admin',
    exp: expire
  }

  const access_token = cloud.getToken(payload)
  return {
    code: 0,
    data: {
      access_token,
      uid: admin._id,
      expire
    }
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

