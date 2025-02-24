'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FindTable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [table, setTable] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get('number');

  useEffect(() => {
    const findTable = async () => {
      try {
        if (!tableNumber) {
          setError('Table number is required');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/tables/find?number=${tableNumber}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError(`Table ${tableNumber} not found`);
          } else {
            const data = await response.json();
            setError(data.error || 'Failed to find table');
          }
          setLoading(false);
          return;
        }

        const tableData = await response.json();
        setTable(tableData);

        // Redirect to table order page after a short delay
        setTimeout(() => {
          router.push(`/order/table/${tableData._id}`);
        }, 2000);
      } catch (err) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    findTable();
  }, [tableNumber, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Finding Table</h1>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Looking for Table {tableNumber}...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 text-lg mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
            <button
              onClick={() => router.push('/qr-scanner')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        ) : table ? (
          <div className="text-center py-8">
            <div className="text-green-500 text-lg mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Table {table.tableNumber} found!
            </div>
            <p className="text-gray-600 mb-4">Redirecting to ordering page...</p>
            <div className="animate-pulse">
              <div className="h-2 bg-blue-200 rounded"></div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}