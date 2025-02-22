import localFont from "next/font/local";
import "./globals.css";
import OfflineStatus from "@/components/ui/offlineStatus";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
      <script src="https://maps.olakrutrim.com/maps/js" />
        <link 
          href="https://maps.olakrutrim.com/maps/css" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-gray-100">
        <header className="bg-blue-600 text-white p-4">
          <h1 className="text-2xl font-bold">POS System</h1>
        </header>
        <main className="p-4">{children}
          <OfflineStatus />
        </main>
      </body>
    </html>
  );
}
