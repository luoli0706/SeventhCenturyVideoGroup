import { defineEventHandler, readBody, createError } from 'h3'
import { readFile, writeFile, access } from 'node:fs/promises'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const CaptchaModule = require('@alicloud/captcha20230305')
const OpenApiCore = require('@alicloud/openapi-core')

const CaptchaClient = CaptchaModule.default
const Config = OpenApiCore.$OpenApiUtil.Config

const COUNTER_PATH = join(process.cwd(), 'data', 'daily-verify-count.json')
const DAILY_LIMIT = 1000

async function checkDailyLimit(): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10)
  let count = 0
  try {
    await access(COUNTER_PATH)
    const raw = await readFile(COUNTER_PATH, 'utf-8')
    const data = JSON.parse(raw)
    if (data.date === today) {
      count = data.count
    }
  } catch {
    // file doesn't exist or corrupt — start fresh
  }
  if (count >= DAILY_LIMIT) return false
  await writeFile(COUNTER_PATH, JSON.stringify({ date: today, count: count + 1 }))
  return true
}

export default defineEventHandler(async (event) => {
  const { captchaVerifyParam, sceneId } = await readBody(event)
  if (!captchaVerifyParam) {
    throw createError({ statusCode: 400, statusMessage: 'captchaVerifyParam is required' })
  }

  // Daily circuit breaker
  if (!(await checkDailyLimit())) {
    return { success: true, bypassed: true }
  }

  const config = useRuntimeConfig(event)
  const { accessKeyId, accessKeySecret } = config.aliyunCaptcha as any
  if (!accessKeyId || !accessKeySecret) {
    throw createError({ statusCode: 500, statusMessage: 'Aliyun CAPTCHA not configured' })
  }

  try {
    const clientConfig = new Config({
      accessKeyId,
      accessKeySecret,
      endpoint: 'captcha.cn-shanghai.aliyuncs.com',
    })
    const client = new CaptchaClient(clientConfig)

    const authSceneId = sceneId || (config.public as any).aliyunCaptchaSceneId
    const request = new CaptchaModule.VerifyIntelligentCaptchaRequest({
      captchaVerifyParam: captchaVerifyParam,
      sceneId: authSceneId,
    })

    const response = await client.verifyIntelligentCaptcha(request)
    const result = response.body as any
    const verifyResult = result.result?.verifyResult === true
    return {
      success: verifyResult,
      verifyResult,
      verifyCode: result.result?.verifyCode,
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `CAPTCHA verify failed: ${err.message}`,
    })
  }
})
