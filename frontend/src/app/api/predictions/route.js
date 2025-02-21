// app/api/predictions/route.js
export async function POST(request) {
    try {
      const data = await request.json();
      
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const prediction = await response.json();
      return Response.json(prediction);
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }