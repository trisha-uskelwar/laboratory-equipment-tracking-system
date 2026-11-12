const express = require('express')
const cors = require('cors')
require('dotenv').config()

require('node:dns').setServers(['8.8.8.8', '8.8.4.4'])

const connectDB = require('./config/db')
const equipmentRoutes = require('./routes/equipmentRoutes')

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

app.use('/api/equipment', equipmentRoutes)

// Test route
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

startServer()