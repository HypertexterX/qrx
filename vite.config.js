import { defineConfig } from 'vite';
import { minify } from 'html-minifier-terser';
import fs from 'fs';
import path from 'path';

// This is the custom plugin that will do the aggressive minification.
const htmlMinifierPlugin = () => {
  return {
    name: 'html-minifier-plugin',
    // This hook runs after the bundle is generated.
    closeBundle: async () => {
      const distPath = path.resolve(__dirname, 'dist/index.html');
      
      // Read the file Vite generated.
      const html = fs.readFileSync(distPath, 'utf8');
      
      // Minify it with all the options.
      const minifiedHtml = await minify(html, {
        removeComments: true,
        collapseWhitespace: true,
        minifyJS: true,
        minifyCSS: true,
      });
      
      // Write the hyper-minified file back.
      fs.writeFileSync(distPath, minifiedHtml);
    },
  };
};

export default defineConfig({
  plugins: [
    // Add our custom plugin.
    htmlMinifierPlugin(),
  ],
  // We still set this to remove whitespace from the HTML structure itself
  // before our plugin runs.
  build: {
    minify: 'terser', 
    terserOptions: {
      format: {
        comments: false,
      },
    },
  },
});