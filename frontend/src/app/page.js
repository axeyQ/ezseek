// app/page.js
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Welcome to the POS System</h1>
      <div className="space-y-2">
        <Link href="/menu" className="text-blue-600 hover:underline">
          Go to Menu
        </Link>
        <br />
        <Link href="/orders" className="text-blue-600 hover:underline">
          Go to Orders
        </Link>
      </div>
    </div>
  );
}