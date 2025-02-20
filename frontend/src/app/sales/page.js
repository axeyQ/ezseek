// app/sales/page.js
'use client';

import { useState, useEffect } from 'react';

export default function Sales() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Fetch orders from backend API
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => setOrders(data));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Sales Register</h1>
      <div>
        {orders.map((order) => (
          <div key={order.id} className="border p-4 rounded-lg mb-2">
            <p>{order.item.name} - ${order.item.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}