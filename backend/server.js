
const express = require('express')
const cors = require('cors')
require('dotenv').config()

// Apply the DNS workaround only during local development
if (process.env.NODE_ENV !== 'production') {
  require('node:dns').setServers(['8.8.8.8', '8.8.4.4'])
}

const connectDB = require('./config/db')
const equipmentRoutes = require('./routes/equipmentRoutes')

const app = express()

// Allowed frontend origins
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

// Allow localhost during local development
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173')
}

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (e.g. health checks)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error('Not allowed by CORS'))
    },
  })
)

app.use(express.json())

// Equipment API routes
app.use('/api/equipment', equipmentRoutes)

// Root test route
app.get('/', (req, res) => {
  res.send('LabTrack API is running!')
})

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LabTrack backend is healthy',
  })
})

// Start server after connecting to MongoDB
const startServer = async () => {
  await connectDB()

  const PORT = process.env.PORT || 5000

  app.listen(PORT, () => {
    console.log(`LabTrack server running on port ${PORT}`)
  })
}

startServer().catch((error) => {
  console.error('Failed to start LabTrack server:', error.message)
  process.exit(1)
})
