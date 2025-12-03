const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');

const distDir = path.join(__dirname, '../dist');
const htmlFilePath = path.join(distDir, 'index.html');
const shouldSaveToFile = process.argv.includes('--file');

// 'L' provides the maximum possible data capacity.
const qrOptions = {
  errorCorrectionLevel: 'L',
};

try {
  if (!fs.existsSync(htmlFilePath)) {
    console.error('\x1b[31m%s\x1b[0m', 'Error: Could not find "dist/index.html".');
    console.error('Please run "npm run build" first.');
    process.exit(1);
  }

  const content = fs.readFileSync(htmlFilePath, 'utf8');

  if (shouldSaveToFile) {
    // Called by "npm run build"
    const qrCodeFilePath = path.join(distDir, 'qrx.qrcode.png');
    qrcode.toFile(qrCodeFilePath, content, qrOptions, (err) => {
      if (err) {
        console.error('\x1b[31m%s\x1b[0m', 'Error generating QR code image:');
        throw err;
      }
    });
  } else {
    // Called by "npm run qrcode"
    const terminalOptions = { ...qrOptions, type: 'terminal', small: true };
    qrcode.toString(content, terminalOptions, (err, terminalString) => {
      if (err) {
        console.error('\x1b[31m%s\x1b[0m', 'Error generating QR code for terminal:');
        throw err;
      }
      console.log('--- QR Code Preview ---');
      console.log(terminalString);
    });
  }
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', 'An unexpected error occurred:');
  console.error(error);
  process.exit(1);
}
