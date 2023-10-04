import React from "react";
import '../styles/globals.css';

export const metadata = {
  title: 'Goldfish',
  description: 'Test out your deck',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className='h-screen w-screen'>{children}</body>
    </html>
  )
}
