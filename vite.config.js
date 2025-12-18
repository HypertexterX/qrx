import { defineConfig } from 'vite'
import { minify } from 'html-minifier-terser'
import fs from 'fs'
import path from 'path'
import { galleryPlugin } from './dev/gallery.js'

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
  build: {
    minify: 'terser',
    terserOptions: {
      format: {
        comments: false,
      },
    },
  },
})