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
    this.href = this.parseHref(this.rawContent)
    await this.generateQR()
  }

  parseHref(content) {
    // Compress newlines to spaces for URL safety
    const compressed = content.replace(/[\r\n]+/g, ' ').trim()
    
    const [base, ...rest] = compressed.split('?')
    const qs = rest.join('?')
    
    let href = '/' + base.replace(/^\/+/, '') // Ensure leading slash
    
    if (qs) {
      // Re-encode params to ensure validity
      const params = qs.split('&').map(p => {
        const [k, ...v] = p.split('=')
        // Join v back in case values contained '='
        const val = v.join('=') 
        return `${k}=${encodeURIComponent(val)}`
      }).join('&')
      href += '?' + params
    }
    
    return href
  }

  async generateQR() {
    await qrcode.toFile(this.qrDiskPath, this.href, {
      errorCorrectionLevel: 'L',
      margin: 0,
      scale: 4,
      color: { dark: '#000000', light: '#ffffff' }
    })
  }

  render() {
    // Escape HTML for display in <pre> tags
    const safeCode = this.rawContent.replace(/</g, '&lt;')

    return `
      <div class="card">
        <div class="header">
          <img src="${this.qrWebPath}" class="qr-img" loading="lazy" />
          <div class="link-info">
            <a href="${this.href}">${this.displayName}</a>
          </div>
        </div>
        <div class="source">
          <details open>
            <summary>SOURCE</summary>
            <pre><code>${safeCode}</code></pre>
          </details>
        </div>
      </div>
    `
  }
}