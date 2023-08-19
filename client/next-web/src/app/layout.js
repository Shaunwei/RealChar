import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Real Char.',
  description: 'Create, customize and talk to your AI Character/Companion in realtime',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
