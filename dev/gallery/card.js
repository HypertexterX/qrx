import fs from 'fs'
import path from 'path'
import qrcode from 'qrcode'

export class LinkCard {
  constructor(filePath, rootSrc, distDir, qrDir) {
    this.filePath = filePath
    this.rootSrc = rootSrc
    this.qrDir = qrDir
    
    // Derive relative paths
    this.relativePath = path.relative(rootSrc, filePath)
    this.displayName = this.relativePath.replace(/\.link$/, '')
    
    // Create safe filename for QR image (replace / with __)
    this.qrFilename = this.relativePath.replace(/[\/\\]/g, '__').replace('.link', '.png')
    this.qrDiskPath = path.join(qrDir, this.qrFilename)
    this.qrWebPath = `./qrcodes/${this.qrFilename}` // Relative to html file
  }

  async process() {
    this.rawContent = fs.readFileSync(this.filePath, 'utf8')
    
    // 1. Get the components (Base path vs Query String)
    const { pathPart, rawQueryString } = this.parseComponents(this.rawContent)

    // 2. Create the HTML-safe version (Encoded)
    // We strictly encode params here so they don't break HTML attributes
    this.href = pathPart
    if (rawQueryString) {
      const encodedParams = rawQueryString.split('&').map(p => {
        const [k, ...v] = p.split('=')
        const val = v.join('=') 
        return `${k}=${encodeURIComponent(val)}`
      }).join('&')
      this.href += '?' + encodedParams
    }

    // 3. Create the QR version (Raw)
    // We only attach the raw query string. This saves massive amounts of space.
    this.qrUrl = pathPart + (rawQueryString ? '?' + rawQueryString : '')

    await this.generateQR()
  }

  // Helper to clean structure but keep raw data
  parseComponents(content) {
    // Compress newlines to spaces
    const compressed = content.replace(/[\r\n]+/g, ' ').trim()
    
    const [base, ...rest] = compressed.split('?')
    const rawQueryString = rest.join('?') // Join back if there were multiple ? (rare but possible)
    
    // Clean up the base path structure
    let cleanBase = base.trim()
    let pathPart = ''

    if (cleanBase.startsWith('#')) {
      pathPart = '/' + cleanBase
    } else if (cleanBase.startsWith('/')) {
      pathPart = cleanBase
    } else {
      pathPart = '/#' + cleanBase
    }
    
    return { pathPart, rawQueryString }
  }

  async generateQR() {
    // Use this.qrUrl (the raw version) instead of this.href
    await qrcode.toFile(this.qrDiskPath, this.qrUrl, {
      errorCorrectionLevel: 'L',
      margin: 0,
      scale: 4,
      color: { dark: '#000000', light: '#ffffff' }
    })
  }

  render() {
    const safeCode = this.rawContent.replace(/</g, '&lt;')
    const safeHref = this.href.replace(/'/g, "\\'")

    return `
      <div class="card">
        <div class="header">
          <img src="${this.qrWebPath}" class="qr-img" loading="lazy" />
          <div class="link-info">
            <a href="${this.href}">${this.displayName}</a>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn" onclick="toggleFrame(this, '${safeHref}')">OPEN IN IFRAME</button>
          <a class="btn" href="${this.href}">OPEN HERE</a>
          <a class="btn" href="${this.href}" target="_blank">NEW TAB</a>
        </div>
        
        <div class="preview-box"></div>

        <div class="source">
          <details>
            <summary>SOURCE</summary>
            <pre><code>${safeCode}</code></pre>
          </details>
        </div>
      </div>
    `
  }
}
