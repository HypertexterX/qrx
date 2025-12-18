import path from 'path'
import { GalleryGenerator } from './generator.js'

export const galleryPlugin = () => {
  return {
    name: 'qrx-gallery',
    closeBundle: async () => {
      const root = process.cwd()
      
      const config = {
        sourceDir: path.resolve(root, 'hypertext'),
        distDir: path.resolve(root, 'dist'),
        qrSubDir: 'qrcodes',
        outputFile: 'gallery.html'
      }

      const generator = new GalleryGenerator(config)
      await generator.build()
    }
  }
}