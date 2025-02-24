// database/utils/qrGenerator.js
import QRCode from 'qrcode';

export const generateQRCode = async (data) => {
  try {
    // Generate QR code with specific options
    const qrOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      width: 300
    };

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(data, qrOptions);

    // Generate QR code as string (for terminal display or text-based usage)
    const qrString = await QRCode.toString(data, {
      type: 'terminal',
      ...qrOptions
    });

    return {
      dataUrl: qrDataUrl,
      string: qrString
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Generate QR code with logo in center
export const generateQRWithLogo = async (data, logoUrl) => {
  try {
    const qrOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      width: 300
    };

    // Generate basic QR code
    const qrCodeImage = await QRCode.toCanvas(data, qrOptions);
    const ctx = qrCodeImage.getContext('2d');

    // Load and draw logo
    const logo = new Image();
    logo.src = logoUrl;
    await new Promise((resolve) => {
      logo.onload = () => {
        // Calculate logo size (25% of QR code)
        const logoSize = qrCodeImage.width * 0.25;
        const logoX = (qrCodeImage.width - logoSize) / 2;
        const logoY = (qrCodeImage.height - logoSize) / 2;

        // Draw white background for logo
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(logoX, logoY, logoSize, logoSize);

        // Draw logo
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        resolve();
      };
    });

    return qrCodeImage.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating QR code with logo:', error);
    throw new Error('Failed to generate QR code with logo');
  }
};

// Validate QR code data
export const validateQRData = (data) => {
  if (!data || typeof data !== 'string') {
    throw new Error('Invalid QR code data');
  }
  
  // Add specific validation rules based on your requirements
  if (data.length > 2048) {
    throw new Error('QR code data exceeds maximum length');
  }

  return true;
};