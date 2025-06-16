import Header from "@/components/header";
import "./globals.css";
import {Inter} from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs";
const iner = Inter({subsets: ["latin"] })

export const metadata = {
  title: "TrueLedger",
  description: "One stop Finance Platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body
        className={``}
      >
        {/* header */}
        <Header/>
        <main className="min-h-screen">
          {children}
        </main>
        {/* footer */}
        <footer className="bg-blue-50 py-12">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p>Made on 15.6.25</p>
          </div>
        </footer>
      </body>
    </html>
    </ClerkProvider>
  );
}
