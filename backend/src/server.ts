import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth'
import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true // Allow cookies
}))
app.use(cookieParser()) // Parse cookies
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.get('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'MindX Backend API',
    version: '1.0.0'
  })
})

app.get('/api/hello', (_req: Request, res: Response): void => {
  res.status(200).json({
    message: 'Hello World from MindX API!',
    timestamp: new Date().toISOString()
  })
})

app.use('/api/auth', authRoutes)

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  })
})

// Error handler
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`)
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})
