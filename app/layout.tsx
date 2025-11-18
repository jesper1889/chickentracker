import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChickenTracker',
  description: 'Track your backyard flock with ease',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
