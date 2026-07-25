import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const savePlayerPlugin = () => ({
  name: 'save-player-plugin',
  configureServer(server) {
    server.middlewares.use('/api/save-player', (req, res) => {
      if (req.method === 'POST') {
        let body = ''
        req.on('data', chunk => {
          body += chunk.toString()
        })
        req.on('end', () => {
          try {
            const player = JSON.parse(body)
            const filePath = path.resolve(__dirname, 'src/data/player.json')
            let currentData = []
            if (fs.existsSync(filePath)) {
              currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
            }
            const index = currentData.findIndex(p => p && (p.name === player.name || p.username === player.username))
            if (index !== -1) {
              currentData[index] = player
            } else {
              if (currentData.length === 0) currentData.push(player)
              else currentData[0] = player
            }
            fs.writeFileSync(filePath, JSON.stringify(currentData, null, 4), 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true }))
          } catch (err) {
            console.error('Error saving player.json:', err)
            res.statusCode = 500
            res.end(JSON.stringify({ success: false, error: err.message }))
          }
        })
      } else {
        res.statusCode = 405
        res.end()
      }
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), savePlayerPlugin()],
})
