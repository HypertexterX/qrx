import { defineConfig } from 'vite'
import { minify } from 'html-minifier-terser'
import fs from 'fs'
import path from 'path'

const htmlMinifierPlugin = () => {
  return {
    name: 'html-minifier-plugin',
    closeBundle: async () => {
      const files = ['index.html', 'min.html']

      for (const file of files) {
        const filePath = path.resolve(__dirname, 'dist', file)
        if (fs.existsSync(filePath)) {
          const html = fs.readFileSync(filePath, 'utf8')
          const minified = await minify(html, {
            removeComments: true,
            collapseWhitespace: true,
            minifyJS: true,
            minifyCSS: true,
          })
          fs.writeFileSync(filePath, minified)
        }
      }
    },
  }
}

const generateLinksPlugin = () => {
  return {
    name: 'generate-links-plugin',
    closeBundle: () => {
      const hyperDir = path.resolve(__dirname, 'hypertext')
      const distDir = path.resolve(__dirname, 'dist')
      const outFile = path.join(distDir, 'links.html')

      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true })
      }

      if (!fs.existsSync(hyperDir)) return

      const getLinkFiles = (dir) => {
        let results = []
        const list = fs.readdirSync(dir)
        list.forEach((file) => {
          file = path.join(dir, file)
          const stat = fs.statSync(file)
          if (stat && stat.isDirectory()) {
            results = results.concat(getLinkFiles(file))
          } else if (file.endsWith('.link')) {
            results.push(file)
          }
        })
        return results
      }

      const files = getLinkFiles(hyperDir)
      
      const links = files.map((file) => {
        const content = fs.readFileSync(file, 'utf8')
        // 1. Remove newlines
        const compressed = content.replace(/[\r\n]+/g, ' ').trim()
        
        // 2. Split into the base command and the query parameters
        // Example: #cmd/editor?x=return...
        const [pathAndCommand, ...rest] = compressed.split('?')
        const queryString = rest.join('?') // Rejoin in case code contains '?'

        let finalHref = '/' + pathAndCommand
        
        if (queryString) {
          // 3. Encode each parameter value individually
          const encodedParams = queryString.split('&').map(param => {
            const [key, ...valParts] = param.split('=')
            const value = valParts.join('=')
            return `${key}=${encodeURIComponent(value)}`
          }).join('&')
          
          finalHref += '?' + encodedParams
        }
        
        const name = path.relative(__dirname, file)
        return `<a href="${finalHref}">${name}</a>`
      })

      if (links.length > 0) {
        fs.writeFileSync(outFile, links.join('<br>\n'))
        console.log(`\x1b[36m│\x1b[0m Generated links.html with ${links.length} links`)
      }
    }
  }
}

// Helper to safely add min.html only if it exists in source
const getInputs = () => {
  const inputs = {
    main: path.resolve(__dirname, 'index.html'),
  }
  const minPath = path.resolve(__dirname, 'min.html')
  if (fs.existsSync(minPath)) {
    inputs.min = minPath
  }
  return inputs
}

export default defineConfig({
  plugins: [htmlMinifierPlugin(), generateLinksPlugin()],
  build: {
    rollupOptions: {
      input: getInputs(),
    },
    minify: 'terser',
    terserOptions: {
      format: {
        comments: false,
      },
    },
  },
})