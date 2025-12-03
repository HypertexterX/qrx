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
  plugins: [htmlMinifierPlugin()],
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