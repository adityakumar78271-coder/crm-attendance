import express from 'express'
import http from 'http'
import path from 'path'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import employeeRoutes from './routes/employeeRoutes.js'
import departmentRoutes from './routes/departmentRoutes.js'
import attendanceRoutes from './routes/attendanceRoutes.js'
import leaveRoutes from './routes/leaveRoutes.js'
import { errorHandler } from './middleware/errorMiddleware.js'
import { initSocket } from './utils/socket.js'

dotenv.config()
connectDB()

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 5000

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://175.111.97.247:5173',
  'http://175.111.97.247:5174',
  'https://crm-attendance.onrender.com'
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }
    callback(new Error('CORS not allowed'))
  },
  credentials: true
}))
app.use(express.json({ limit: '20mb' }))
app.use(cookieParser())
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Attendance CRM Backend Running'
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/leaves', leaveRoutes)

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online'
  })
})

app.use(errorHandler)

initSocket(server)

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
