import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { LinkCard } from './card.js'

// ESM workaround for __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export class GalleryGenerator {
  constructor(config) {
    this.src = config.sourceDir
    this.dist = config.distDir
    this.qrDir = path.join(this.dist, config.qrSubDir)
    this.outFile = path.join(this.dist, config.outputFile)
    
    // Asset paths
    this.assets = {
      css: path.join(__dirname, 'assets', 'styles.css'),
      html: path.join(__dirname, 'assets', 'layout.html')
    }
  }

  async build() {
    if (!fs.existsSync(this.src)) return

    console.log(`\x1b[36m│\x1b[0m [Gallery] Starting build...`)
    this.prepareDirectories()

    const files = this.scanDirectory(this.src)
    const cards = []

    console.log(`\x1b[36m│\x1b[0m [Gallery] Processing ${files.length} links...`)

    // Process files in parallel for speed
    await Promise.all(files.map(async (file) => {
      const card = new LinkCard(file, this.src, this.dist, this.qrDir)
      await card.process()
      cards.push(card)
    }))

    // Sort alphabetically for consistency
    cards.sort((a, b) => a.displayName.localeCompare(b.displayName))

    this.writeOutput(cards)
    console.log(`\x1b[36m│\x1b[0m [Gallery] Generated ${this.outFile}`)
  }

  prepareDirectories() {
    if (!fs.existsSync(this.dist)) fs.mkdirSync(this.dist, { recursive: true })
    if (!fs.existsSync(this.qrDir)) fs.mkdirSync(this.qrDir, { recursive: true })
  }

  scanDirectory(dir) {
    let results = []
    const list = fs.readdirSync(dir)
    
    list.forEach(file => {
      if (file === 'private') {
        return; 
      }

      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)
      
      if (stat && stat.isDirectory()) {
        results = results.concat(this.scanDirectory(fullPath))
      } else if (file.endsWith('.link')) {
        results.push(fullPath)
      }
    })
    
    return results
  }

  writeOutput(cards) {
    if (cards.length === 0) return

    const css = fs.readFileSync(this.assets.css, 'utf8')
    const layout = fs.readFileSync(this.assets.html, 'utf8')
    const cardHtml = cards.map(c => c.render()).join('\n')

    const finalHtml = layout
      .replace('<!-- INJECT_CSS -->', css)
      .replace('<!-- INJECT_CARDS -->', cardHtml)

    fs.writeFileSync(this.outFile, finalHtml)
  }
}
