import fs from 'fs'
import path from 'path'
import qrcode from 'qrcode'

const TEMPLATE = (cards) => `
<!DOCTYPE html>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QRx Hyperlinks</title>
<style>
  :root { 
    --bg: #0a0a0a; --fg: #e0e0e0; --accent: #00ffcc; --card: #111; --border: #333;
    font-family: 'Courier New', monospace; 
  }
  body { margin: 0; padding: 20px; background: var(--bg); color: var(--fg); }
  
  .grid { 
    display: grid; 
    gap: 20px; 
    grid-template-columns: 1fr; 
  }
  @media(min-width: 900px) {
    .grid { grid-template-columns: 1fr 1fr 1fr 1fr; }
  }

  .card { 
    border: 1px solid var(--border); 
    background: var(--card);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .header {
    background: #fff;
    color: #000;
    padding: 20px;
    gap: 20px;
    border-bottom: 1px solid var(--border);
  }
  .qr-img { 
    max-width: 100%;
    image-rendering: pixelated; 
    display: block;
    margin-bottom: 1rem;
  }
  .link-info { flex-grow: 1; word-break: break-all; }
  .link-info a { 
    color: #f00; 
    font-weight: bold; 
    font-size: 1.1em;
    text-decoration: none;
    border-bottom: 2px solid #000;
  }
  .link-info a:hover { color: #555; border-color: #555; }

  .source { padding: 0; }
  summary { 
    padding: 10px 20px;
    cursor: pointer;
    background: #1a1a1a;
    border-bottom: 1px solid var(--border);
    user-select: none;
    color: var(--accent);
  }
  summary:hover { background: #222; }
  
  pre { 
    margin: 0; 
    padding: 20px; 
    overflow-x: auto; 
    white-space: pre-wrap; 
    word-break: break-word;
    font-size: 0.85em;
    line-height: 1.4;
    color: #bbb;
    background: #000;
    max-height: 600px; 
    overflow-y: auto;
  }
</style>

<div class="grid">
  ${cards.join('\n')}
</div>
`

const buildCard = (qrPath, href, name, code) => `
  <div class="card">
    <div class="header">
      <img src="${qrPath}" class="qr-img" />
      <div class="link-info">
        <a href="${href}">${name}</a>
      </div>
    </div>
    <div class="source">
      <details open>
        <summary>SOURCE</summary>
        <pre><code>${code.replace(/</g, '&lt;')}</code></pre>
      </details>
    </div>
  </div>
`

export const galleryPlugin = () => {
  return {
    name: 'gallery-plugin',
    closeBundle: async () => {
      const root = process.cwd()
      const hyperDir = path.resolve(root, 'hypertext')
      const distDir = path.resolve(root, 'dist')
      const qrDir = path.join(distDir, 'qrcodes')
      const outFile = path.join(distDir, 'gallery.html')

      if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true })
      if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true })
      if (!fs.existsSync(hyperDir)) return

      const getLinkFiles = (dir) => {
        let results = []
        const list = fs.readdirSync(dir)
        list.forEach((file) => {
          file = path.join(dir, file)
          const stat = fs.statSync(file)
          if (stat && stat.isDirectory()) results = results.concat(getLinkFiles(file))
          else if (file.endsWith('.link')) results.push(file)
        })
        return results
      }

      const files = getLinkFiles(hyperDir)
      const cards = []

      console.log(`\x1b[36m│\x1b[0m Generating Gallery for ${files.length} links...`)

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8')
        
        const compressed = content.replace(/[\r\n]+/g, ' ').trim()
        const [base, ...rest] = compressed.split('?')
        const qs = rest.join('?')
        
        let href = '/' + base
        if (qs) {
          const params = qs.split('&').map(p => {
            const [k, ...v] = p.split('=')
            return `${k}=${encodeURIComponent(v.join('='))}`
          }).join('&')
          href += '?' + params
        }

        // --- Clean Name Logic ---
        const relName = path.relative(hyperDir, file)
        // Clean display name removes the .link extension
        const displayName = relName.replace(/\.link$/, '')
        // QR filename replaces slashes with underscores and changes .link to .png
        const qrName = relName.replace(/[\/\\]/g, '__').replace('.link', '.png')
        
        await qrcode.toFile(path.join(qrDir, qrName), href, {
          errorCorrectionLevel: 'L',
          margin: 0,
          scale: 4,
          color: { dark: '#000000', light: '#ffffff' }
        })

        // Use displayName for the anchor text
        cards.push(buildCard(`./qrcodes/${qrName}`, href, displayName, content))
      }

      if (cards.length > 0) {
        fs.writeFileSync(outFile, TEMPLATE(cards))
        console.log(`\x1b[36m│\x1b[0m Created dist/gallery.html`)
      }
    }
  }
}