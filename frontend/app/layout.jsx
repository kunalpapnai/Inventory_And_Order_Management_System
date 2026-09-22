import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'StockFlow - Inventory & Order Management System',
  description: 'Full-stack inventory and order management system for modern small businesses.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
