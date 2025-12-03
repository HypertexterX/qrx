const fs = require('fs')
const path = require('path')
const qrcode = require('qrcode')

const distDir = path.join(__dirname, '../dist')
const shouldSaveToFile = process.argv.includes('--file')
const targetFiles = ['index.html', 'min.html']

const qrOptions = {
  errorCorrectionLevel: 'L',
}

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(2)} kB`
}

const log = (msg, color = '0') => console.log(`\x1b[36m│\x1b[0m \x1b[${color}m${msg}\x1b[0m`)
const logKey = (key, val, color = '33') => console.log(`\x1b[36m│\x1b[0m ${key.padEnd(12)} \x1b[${color}m${val}\x1b[0m`)

const generate = async () => {
  for (const file of targetFiles) {
    const filePath = path.join(distDir, file)
    
    if (!fs.existsSync(filePath)) continue

    console.log(`\n\x1b[36m┌── [ ${file} ]\x1b[0m`)

    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const size = Buffer.byteLength(content, 'utf8')
      
      logKey('Final Size:', formatBytes(size))

      if (shouldSaveToFile) {
        const outName = file.replace('.html', '.qrcode.png')
        const outPath = path.join(distDir, outName)

        try {
          await qrcode.toFile(outPath, content, qrOptions)
          logKey('QR Status:', 'Generated ✔', '32')
          logKey('Saved To:', `dist/${outName}`, '90')
        } catch (err) {
          if (err.message?.includes('too big')) {
            logKey('QR Status:', 'Failed ⚠ (Too Big)', '33')
          } else {
            throw err
          }
        }
      } else {
        // Terminal output mode
        try {
          const terminalStr = await qrcode.toString(content, { ...qrOptions, type: 'terminal', small: true })
          logKey('QR Status:', 'Preview Below', '32')
          console.log(`\x1b[36m└──\x1b[0m`)
          console.log(terminalStr)
          continue
        } catch (err) {
           if (err.message?.includes('too big')) {
            logKey('QR Status:', 'Too big for terminal', '33')
          } else {
            throw err
          }
        }
      }
    } catch (e) {
      log(`Error: ${e.message}`, '31')
    }
    console.log(`\x1b[36m└──\x1b[0m`)
  }
}

generate()