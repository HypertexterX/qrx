import { defineConfig } from 'vite'
import { minify } from 'html-minifier-terser'
import fs from 'fs'
import path from 'path'
import { galleryPlugin } from './dev/gallery/index.js'

const htmlMinifierPlugin = () => {
  return {
    name: 'html-minifier-plugin',
    closeBundle: async () => {
      const filePath = path.resolve(__dirname, 'dist', 'index.html')
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
    },
  }
}

export default defineConfig({
  plugins: [htmlMinifierPlugin(), galleryPlugin()],
  server: {
    watch: {
      // Return true to IGNORE a file. 
      // We ignore everything UNLESS it includes these specific filenames.
      ignored: (path) => {
        const isAllowed = path.includes('index.html') || path.includes('vite.config.js');
        return !isAllowed; 
      },
    },
  },
  build: {
    minify: 'terser',
    terserOptions: {
      format: {
        comments: false,
      },
    },
  },
})
