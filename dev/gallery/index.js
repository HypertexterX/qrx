import path from 'path'
import { GalleryGenerator } from './generator.js'

export const galleryPlugin = () => {
  // 1. Define the build logic in a reusable function
  const rebuild = async () => {
    const root = process.cwd()
    
    const config = {
      sourceDir: path.resolve(root, 'hypertext'),
      distDir: path.resolve(root, 'dist'),
      qrSubDir: 'qrcodes',
      outputFile: 'gallery.html'
    }

    try {
      const generator = new GalleryGenerator(config)
      await generator.build()
    } catch (e) {
      console.error('[Gallery] Build error:', e)
    }
  }

  return {
    name: 'qrx-gallery',
    
    // 2. Run once during production build
    closeBundle: rebuild,

    // 3. Run during Dev Server (npm start)
    configureServer(server) {
      // Run immediately on start
      rebuild()

      // Add custom paths to Vite's watcher
      const watchDirs = [
        path.resolve(process.cwd(), 'hypertext'),
        path.resolve(process.cwd(), 'dev')
      ]
      server.watcher.add(watchDirs)

      // Listen for changes
      const handleUpdate = (file) => {
        if (watchDirs.some(dir => file.startsWith(dir))) {
          rebuild()
        }
      }

      server.watcher.on('add', handleUpdate)
      server.watcher.on('change', handleUpdate)
      server.watcher.on('unlink', handleUpdate)
    }
  }
}