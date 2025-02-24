// src/services/tableQRService.js
import QRCode from 'qrcode';

export const tableQRService = {
  async generateQRCode(tableId, tableNumber) {
    try {
      // Generate a unique URL for the table
      const orderingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/order/table/${tableId}`;
      
      // Generate QR code as a data URL
      const qrCode = await QRCode.toString(orderingUrl, {
        type: 'svg',
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Convert SVG string to data URL
      const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(qrCode).toString('base64')}`;

      return {
        qrCode: svgDataUrl,
        orderingUrl,
        tableId,
        tableNumber,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  },

  // Validate QR code URL
  validateQRUrl(url) {
    try {
      const qrUrl = new URL(url);
      const pathParts = qrUrl.pathname.split('/');
      const tableId = pathParts[pathParts.length - 1];
      
      return {
        isValid: true,
        tableId
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid QR code URL'
      };
    }
  },

  // Generate batch QR codes for multiple tables
  async generateBatchQRCodes(tables) {
    try {
      const qrCodes = await Promise.all(
        tables.map(async (table) => {
          try {
            return await this.generateQRCode(table._id, table.tableNumber);
          } catch (error) {
            console.error(`Failed to generate QR code for table ${table.tableNumber}:`, error);
            return null;
          }
        })
      );

      return qrCodes.filter(Boolean); // Remove any failed generations
    } catch (error) {
      console.error('Error generating batch QR codes:', error);
      throw error;
    }
  }
};