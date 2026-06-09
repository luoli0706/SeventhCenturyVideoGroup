import { defineEventHandler, readBody, createError } from 'h3'
import { readFile, writeFile, access } from 'node:fs/promises'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import * as crypto from 'node:crypto'

const require = createRequire(import.meta.url)
const CaptchaModule = require('@alicloud/captcha20230305')
const OpenApiCore = require('@alicloud/openapi-core')

const CaptchaClient = CaptchaModule.default
const Config = OpenApiCore.$OpenApiUtil.Config

const COUNTER_PATH = join(process.cwd(), 'data', 'daily-verify-count.json')
const DAILY_LIMIT = 1000
const TOKEN_EXPIRY_DAYS = 30

// --- JWT helpers (built-in crypto, no npm deps) ---
function getJwtSecret(aliyunConfig: any): string {
  if (aliyunConfig.jwtSecret) return aliyunConfig.jwtSecret
  return crypto.createHash('sha256').update(aliyunConfig.accessKeySecret || '').digest('hex')
}

function signCaptchaToken(secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const payload = Buffer.from(JSON.stringify({
    type: 'captcha_exempt',
    iat: now,
    exp: now + TOKEN_EXPIRY_DAYS * 86400,
  })).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}

function verifyCaptchaToken(token: string, secret: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const signature = crypto.createHmac('sha256', secret).update(`${parts[0]}.${parts[1]}`).digest('base64url')
    if (signature !== parts[2]) return false
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    if (payload.type !== 'captcha_exempt') return false
    if (payload.exp && Date.now() / 1000 > payload.exp) return false
    return true
  } catch {
    return false
  }
}
// --- end JWT helpers ---

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
  const { captchaVerifyParam, sceneId, captchaToken } = await readBody(event)
  const config = useRuntimeConfig(event)
  const aliyunConfig = (config.aliyunCaptcha as any) || {}
  const jwtSecret = getJwtSecret(aliyunConfig)

  // Case 1: captchaToken provided → verify existing 30-day exemption token
  if (captchaToken) {
    const valid = verifyCaptchaToken(captchaToken, jwtSecret)
    return { success: valid }
  }

  // Case 2: captchaVerifyParam required for Aliyun verification
  if (!captchaVerifyParam) {
    throw createError({ statusCode: 400, statusMessage: 'captchaVerifyParam or captchaToken is required' })
  }

  // Daily circuit breaker — issue a token even when bypassing
  if (!(await checkDailyLimit())) {
    const token = signCaptchaToken(jwtSecret)
    return { success: true, bypassed: true, captchaToken: token }
  }

  const { accessKeyId, accessKeySecret } = aliyunConfig
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

    if (verifyResult) {
      const token = signCaptchaToken(jwtSecret)
      return {
        success: true,
        verifyResult: true,
        verifyCode: result.result?.verifyCode,
        captchaToken: token,
      }
    }

    return {
      success: false,
      verifyResult: false,
      verifyCode: result.result?.verifyCode,
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `CAPTCHA verify failed: ${err.message}`,
    })
  }
})
