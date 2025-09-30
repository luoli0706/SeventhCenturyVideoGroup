const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const { createClient } = require('redis');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Redis客户端
const redisClient = createClient({
  host: process.env.REDIS_HOST || 'redis-verify',
  port: process.env.REDIS_PORT || 6379,
  db: process.env.REDIS_DB || 0
});

// 连接Redis
redisClient.connect().catch(console.error);

// 速率限制
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'cf_verify_limit',
  points: 5, // 5次尝试
  duration: 300, // 5分钟内
});

// 中间件
app.use(helmet());
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || '').split(','),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 验证Cloudflare Turnstile token
app.post('/verify', async (req, res) => {
  try {
    const { token, userIP } = req.body;
    const clientIP = userIP || req.ip || req.connection.remoteAddress;

    // 速率限制检查
    try {
      await rateLimiter.consume(clientIP);
    } catch (rejRes) {
      return res.status(429).json({
        success: false,
        error: 'Too many verification attempts',
        retryAfter: rejRes.msBeforeNext
      });
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Missing verification token'
      });
    }

    // 向Cloudflare验证token
    const verifyResponse = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: clientIP
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const { success, 'error-codes': errorCodes } = verifyResponse.data;

    if (success) {
      // 生成验证令牌
      const verifyToken = uuidv4();
      const sessionKey = `verify_session:${verifyToken}`;
      
      // 在Redis中存储验证状态 (有效期30分钟)
      await redisClient.setEx(sessionKey, 1800, JSON.stringify({
        verified: true,
        ip: clientIP,
        timestamp: Date.now(),
        userAgent: req.get('User-Agent') || ''
      }));

      res.json({
        success: true,
        verifyToken: verifyToken,
        expiresIn: 1800
      });
    } else {
      console.error('Cloudflare verification failed:', errorCodes);
      res.status(400).json({
        success: false,
        error: 'Verification failed',
        details: errorCodes
      });
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 检查验证状态
app.post('/check', async (req, res) => {
  try {
    const { verifyToken } = req.body;
    
    if (!verifyToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing verify token'
      });
    }

    const sessionKey = `verify_session:${verifyToken}`;
    const sessionData = await redisClient.get(sessionKey);

    if (sessionData) {
      const session = JSON.parse(sessionData);
      res.json({
        success: true,
        verified: session.verified,
        timestamp: session.timestamp
      });
    } else {
      res.json({
        success: false,
        verified: false,
        error: 'Session expired or invalid'
      });
    }
  } catch (error) {
    console.error('Check verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 获取站点密钥 (仅返回公开的site key)
app.get('/config', (req, res) => {
  res.json({
    siteKey: process.env.TURNSTILE_SITE_KEY || '',
    timeout: parseInt(process.env.VERIFY_TIMEOUT) || 300
  });
});

// 错误处理
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// 启动服务
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Cloudflare Verify Service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Allowed origins: ${process.env.ALLOWED_ORIGINS}`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully');
  await redisClient.quit();
  process.exit(0);
});