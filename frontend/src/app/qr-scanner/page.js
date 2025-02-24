'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function QRScanner() {
  const [hasCamera, setHasCamera] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    // Check if the browser supports getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setHasCamera(true);
    } else {
      setError('Your browser does not support accessing the camera.');
    }

    // Clean up on unmount
    return () => {
      stopCamera();
    };
  }, []);

  const startScanning = async () => {
    try {
      setScanning(true);
      setError(null);

      const constraints = {
        video: { facingMode: 'environment' }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        checkVideoFrame();
      }
    } catch (err) {
      setError('Failed to access camera: ' + err.message);
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const checkVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video is playing
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(checkVideoFrame);
      return;
    }

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data for QR code processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Here you would normally process the image data with a QR code library
    // For demonstration, we'll just simulate finding a QR code after a delay
    setTimeout(() => {
      if (scanning) {
        processQRCode('table/12345'); // Simulated QR code result
      }
    }, 3000);

    // Continue scanning
    if (scanning) {
      requestAnimationFrame(checkVideoFrame);
    }
  };

  const processQRCode = (qrData) => {
    // Stop scanning
    stopCamera();

    // Check if QR code data is a valid table URL
    if (qrData.includes('table/')) {
      const tableId = qrData.split('table/')[1];
      router.push(`/order/table/${tableId}`);
    } else {
      setError('Invalid QR code. Please scan a valid table QR code.');
    }
  };

  // For manual entry of table number
  const handleManualEntry = (e) => {
    e.preventDefault();
    const tableNumber = e.target.tableNumber.value;
    if (!tableNumber) {
      setError('Please enter a table number');
      return;
    }

    // Redirect to the manual entry process
    router.push(`/tables/find?number=${tableNumber}`);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Scan Table QR Code</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right">×</button>
        </div>
      )}

      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Scan the QR code on your table to access the menu and place your order directly from your device.
        </p>

        {hasCamera ? (
          <div className="flex flex-col items-center">
            <div className="relative bg-black rounded-lg mb-4 overflow-hidden">
              <video
                ref={videoRef}
                className="w-full max-h-96 object-contain"
                playsInline
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 invisible"
              />
              
              {/* QR code scanning overlay */}
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-blue-500 w-2/3 h-2/3 rounded-lg"></div>
                </div>
              )}
            </div>

            {!scanning ? (
              <button
                onClick={startScanning}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Start Scanning
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Stop Scanning
              </button>
            )}
          </div>
        ) : (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-3 rounded mb-4">
            Camera access is not available on your device or browser.
          </div>
        )}
      </div>

      <div className="mt-8 border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Manual Entry</h2>
        <p className="text-gray-600 mb-4">
          Don't want to scan? Enter your table number directly.
        </p>

        <form onSubmit={handleManualEntry} className="flex gap-2">
          <input
            type="number"
            name="tableNumber"
            placeholder="Enter table number"
            className="flex-1 p-2 border rounded"
            min="1"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Go to Table
          </button>
        </form>
      </div>
    </div>
  );
}