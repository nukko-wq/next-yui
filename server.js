const { createServer } = require('node:http')
const { parse } = require('node:url')
const next = require('next')
const { Server } = require('socket.io')
const { getGeminiBot } = require('./src/lib/gemini-server.js')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  let geminiBot
  try {
    geminiBot = getGeminiBot()
  } catch (error) {
    console.error('Failed to initialize Gemini bot:', error)
    process.exit(1)
  }

  io.on('connection', (socket) => {
    const sessionId = `session_${socket.id}`
    console.log(`Client connected: ${sessionId}`)

    // 接続確認
    socket.emit('status', {
      connected: true,
      message: 'Gemini チャットボットに接続しました',
      sessionId: sessionId,
    })

    // メッセージ処理
    socket.on('message', async (data) => {
      try {
        const userMessage = data.message?.trim()

        if (!userMessage) {
          socket.emit('response', {
            response: 'メッセージが空です。',
            success: false,
            error: 'empty_message',
          })
          return
        }

        // 通常のレスポンスを使用（ストリーミング無効化）
        const response = await geminiBot.generateResponse(sessionId, userMessage)
        socket.emit('response', response)
      } catch (error) {
        console.error('Error handling message:', error)
        socket.emit('response', {
          response: `メッセージ処理中にエラーが発生しました: ${String(error)}`,
          success: false,
          error: String(error),
        })
      }
    })

    // セッションクリア
    socket.on('clear_session', () => {
      try {
        geminiBot.clearSession(sessionId)
        socket.emit('response', {
          response: '会話履歴をクリアしました。',
          success: true,
          action: 'session_cleared',
        })
      } catch (error) {
        console.error('Error clearing session:', error)
        socket.emit('response', {
          response: `セッションクリア中にエラーが発生しました: ${String(error)}`,
          success: false,
          error: String(error),
        })
      }
    })

    // 切断処理
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${sessionId}`)
      // セッション履歴は保持（必要に応じてクリア可能）
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
