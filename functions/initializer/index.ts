
/**
 * 本函数会默认配置 'App:ready' 事件触发器，应用启动并初始化完成后被自动调用。
 * 
 * 本函数可用于初始化应用必要的一些配置、数据，通常不需要删除此云函数，也不要开启 HTTP 调用。
 */

import cloud from '@/cloud-sdk'

exports.main = async function (ctx) {

  await cloud.invoke('init-app-rbac', {})
    .then(() => console.log('初始化 RBAC'))
    .catch(err => console.log(err))

  await initIndexes()
    .then(() => console.log('初始化应用集合索引'))
    .catch(err => console.log(err))

  await cloud.invoke('init_shared_utils', {})
    .then(() => console.log('初始化 shared_utils'))
    .catch(err => console.log(err))

  await cloud.invoke('init-sys-region', {})
    .then(() => console.log('初始化行政区域数据'))
    .catch(err => console.log(err))

  return 'ok'
}

/**
 * 初始化应用集合索引
 */
async function initIndexes() {
  const db = cloud.mongo.db
  await db.collection('sys_config').createIndex({ key: 1 }, { unique: true })
  await db.collection('sys_sms_history').createIndex({ phone: 1, created_at: -1 })
}
