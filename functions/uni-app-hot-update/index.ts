
/**
 * Uni app 热更新 wgt 包
 */
import cloud from '@/cloud-sdk'

/** 确保 data bucket 存在，并开放读 */
const BUCKET = `${cloud.appid}_data`

/** 确保 /wgt 目录存在 */
/** 将 wgt 文件上传到 /wgt/ 目录下即可，文件名应如： 1.0.0.wgt, 1.0.1.wgt */
const DIR_URL = `https://${BUCKET}.fs.lafyun.com/wgt/`


exports.main = async function (ctx) {
  const { body } = ctx

  // 入参检查
  const { appid, version } = body
  console.log({ appid, version })
  if (!appid || !version) {
    return { code: 'INVALID_PARAM', error: 'Missing parameters' }
  }

  const latest = await getLatestWgt()
  console.log(latest)

  // 客户端版本 大于等于 服务器存储的最新版本
  if (version >= latest.version) {
    return { code: 1, data: '客户端已是最新版本，无需更新' }
  }

  // 客户端版本比 服务器存储的最新版本 低
  return {
    code: 0,
    data: `有新版本, 请更新至最新版本: ${latest.version}`,
    download_url: latest.url,
    new_version: latest.version
  }
}

/**
 * 获取 /wgt/ 目录下最新的 wgt 文件
 */
async function getLatestWgt() {
  const files: any[] = await loadWgtFiles()
  const latest = files
    .filter(it => it.metadata?.name?.endsWith('.wgt'))
    .sort((a, b) => {
      return a.metadata?.name < b.metadata?.name ? 1 : -1
    })
    .at(0)

  if (!latest) return null
  const name = latest.metadata.name
  const [version] = name.split('.wgt')
  return {
    version,
    url: DIR_URL + latest.metadata.name
  }
}

/**
 * 获取 /wgt/ 目录下的文件列表
 */
async function loadWgtFiles() {
  const token = cloud.getToken({
    ns: BUCKET,
    op: 'rl',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  })

  const res = await cloud.fetch({
    url: DIR_URL + `?token=${token}`,
    method: 'get'
  })

  if (res.data?.type !== 'directory') {
    throw new Error(DIR_URL + ' must be a directory')
  }

  return res.data.data || []
}

