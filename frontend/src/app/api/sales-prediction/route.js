// app/api/sales-prediction/route.js
export async function POST(request) {
    const { day } = await request.json();
    const response = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day }),
    });
    const data = await response.json();
    return Response.json(data);
  }