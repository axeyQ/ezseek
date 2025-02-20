// app/tables/[id]/page.js
export default function TableDetails({ params }) {
    const table = { id: params.id, name: `Table ${params.id}`, status: 'available' };
  
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Table {params.id}</h1>
        <p>Status: {table.status}</p>
      </div>
    );
  }