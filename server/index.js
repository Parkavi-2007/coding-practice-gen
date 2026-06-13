require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CodeGen API is running' })
})

app.use('/api/problems', require('./routes/problems'))

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})