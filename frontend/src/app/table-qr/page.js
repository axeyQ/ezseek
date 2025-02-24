'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TableQRManagement() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tables');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }
      
      const data = await response.json();
      setTables(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (tableId) => {
    try {
      const response = await fetch('/api/tables/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tableId })
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const updatedTable = await response.json();
      
      // Update tables list with the new QR code
      setTables(prevTables =>
        prevTables.map(table =>
          table._id === updatedTable._id ? updatedTable : table
        )
      );

      return updatedTable;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const handleShowQR = async (table) => {
    setSelectedTable(table);
    
    // Generate QR code if it doesn't exist
    if (!table.qrCode?.image) {
      const updatedTable = await generateQRCode(table._id);
      if (updatedTable) {
        setSelectedTable(updatedTable);
      }
    }
    
    setShowQRModal(true);
  };

  const downloadQR = (table) => {
    const link = document.createElement('a');
    link.href = table.qrCode.image;
    link.download = `table-${table.tableNumber}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQR = (table) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Table ${table.tableNumber} QR Code</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 20px;
              border: 1px solid #ccc;
              border-radius: 10px;
              background-color: white;
            }
            img {
              max-width: 300px;
              margin-bottom: 20px;
            }
            .info {
              text-align: center;
            }
            .instructions {
              margin-top: 20px;
              font-size: 14px;
              color: #666;
              max-width: 300px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${table.qrCode.image}" alt="Table QR Code">
            <div class="info">
              <h2>Table ${table.tableNumber}</h2>
              <p>Scan to place your order</p>
            </div>
            <div class="instructions">
              Scan this QR code with your phone camera to access the menu and place your order directly from your device.
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const printAllQRCodes = async () => {
    try {
      // Generate QR codes for any tables that don't have them
      for (const table of tables) {
        if (!table.qrCode?.image) {
          await generateQRCode(table._id);
        }
      }

      // Refresh tables to get the latest QR codes
      await fetchTables();

      // Create print window with all QR codes
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>All Table QR Codes</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
              }
              .qr-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                page-break-inside: avoid;
              }
              .qr-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 20px;
                border: 1px solid #ccc;
                border-radius: 10px;
                page-break-inside: avoid;
              }
              img {
                max-width: 200px;
                margin-bottom: 10px;
              }
              .info {
                text-align: center;
                margin-top: 10px;
              }
              @media print {
                .qr-item {
                  page-break-inside: avoid;
                  break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <div class="qr-grid">
              ${tables.map(table => `
                <div class="qr-item">
                  <img src="${table.qrCode?.image}" alt="Table ${table.tableNumber} QR Code">
                  <div class="info">
                    <h2>Table ${table.tableNumber}</h2>
                    <p>Scan to place your order</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } catch (err) {
      setError(err.message);
    }
  };

  // QR Modal Component
  const QRModal = ({ table, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Table {table.tableNumber} QR Code</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>
        
        <div className="flex flex-col items-center mb-4">
          <img 
            src={table.qrCode?.image} 
            alt={`QR Code for Table ${table.tableNumber}`}
            className="w-64 h-64 mb-4"
          />
          <p className="text-sm text-gray-600 mb-2">
            Scan this QR code to access the ordering page
          </p>
          <p className="text-xs text-gray-500 mb-2">
            Generated: {table.qrCode?.generatedAt ? new Date(table.qrCode.generatedAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>

        <div className="flex justify-center gap-2">
          <button
            onClick={() => downloadQR(table)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Download
          </button>
          <button
            onClick={() => printQR(table)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="p-4">Loading tables...</div>;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Table QR Codes</h1>
        <div className="space-x-2">
          <button
            onClick={printAllQRCodes}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Print All QR Codes
          </button>
          <button
            onClick={() => router.push('/tables')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Manage Tables
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.filter(table => table.isActive).map(table => (
          <div key={table._id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Table {table.tableNumber}</h2>
              <span className={`px-2 py-1 rounded text-sm ${
                table.status === 'available' ? 'bg-green-100 text-green-800' :
                table.status === 'occupied' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {table.status}
              </span>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              <p>Capacity: {table.capacity} people</p>
              <p>Location: {table.location}</p>
              {table.qrCode?.generatedAt && (
                <p>QR Last Generated: {new Date(table.qrCode.generatedAt).toLocaleDateString()}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleShowQR(table)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {table.qrCode?.image ? 'View QR' : 'Generate QR'}
              </button>
              <button
                onClick={() => generateQRCode(table._id)}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Regenerate QR
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedTable && (
        <QRModal
          table={selectedTable}
          onClose={() => {
            setShowQRModal(false);
            setSelectedTable(null);
          }}
        />
      )}
    </div>
  );
}