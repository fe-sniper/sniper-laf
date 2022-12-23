
import cloud from '@/cloud-sdk'
import { ObjectId } from 'mongodb'
const data_url = 'https://a5bec5b2-ebd0-4803-b29b-0a1766aa7edf_data.fs.lafyun.com/sys_region.json'

exports.main = async function (ctx) {
  
  const db = cloud.mongo.db
  await db.collection('sys_region').createIndex({ code: 1 }, { unique: true})

  const data = await loadData()
  for (const item of data) {
    await insertItem(item, 1)
    console.log(`completed: ${item.name}`)
  }

  return 'ok'
}

async function loadData() {
  const res = await cloud.fetch(data_url)
  return res.data
}

async function insertItem(item: any, level: number) {
  const db = cloud.mongo.db 
  const _data = {
    _id: new ObjectId().toHexString(),
    code: item.id,
    parent: item.parentId,
    label: item.label,
    level
  }
  try {
      const res = await db.collection('sys_region')
        .insertOne(_data)

      console.log(`i.${item.label}`, res.insertedId)
  } catch (error) {
    if (error.code != 11000) {
      throw error
    }
  }

  if (!item.children?.length) {
    return
  }

  // recursively insert children
  for (const sub of item.children) {
    await insertItem(sub, level + 1)
  }
}