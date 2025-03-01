'use client';
import { useState, useEffect } from 'react';

export default function TableManagement() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables/qr');
      if (!response.ok) throw new Error('Failed to fetch tables');
      const data = await response.json();
      setTables(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateQR = async (tableId) => {
    try {
      const response = await fetch('/api/tables/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tableId })
      });

      if (!response.ok) throw new Error('Failed to generate QR code');
      const updatedTable = await response.json();
      
      setTables(prevTables =>
        prevTables.map(table =>
          table._id === updatedTable._id ? updatedTable : table
        )
      );

      return updatedTable;
    } catch (err) {
      setError(err.message);
    }
  };

  const handleShowQR = async (table) => {
    setSelectedTable(table);
    if (!table.qrCode?.image) {
      await generateQR(table._id);
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
            }
            img { max-width: 300px; }
            .info { margin-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <img src="${table.qrCode.image}" alt="Table QR Code">
          <div class="info">
            <h2>Table ${table.tableNumber}</h2>
            <p>Scan to place order</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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
            Generated: {new Date(table.qrCode?.generatedAt).toLocaleDateString()}
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
        <h1 className="text-2xl font-bold">Table Management</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map(table => (
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
                onClick={() => generateQR(table._id)}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Regenerate QR
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Table Form */}
      <form className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Add New Table</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Table Number</label>
            <input
              type="number"
              min="1"
              className="w-full p-2 border rounded"
              // Add necessary state and handlers
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Capacity</label>
            <input
              type="number"
              min="1"
              className="w-full p-2 border rounded"
              // Add necessary state and handlers
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <select className="w-full p-2 border rounded">
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
              <option value="balcony">Balcony</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Table
        </button>
      </form>

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

      {/* Table Edit Modal */}
      {/* Add your table edit modal here if needed */}
    </div>
  );
}