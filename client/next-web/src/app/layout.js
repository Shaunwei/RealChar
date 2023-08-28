import './globals.css';
import { Prompt } from 'next/font/google';
import { Providers } from './providers';
import Header from './_components/header';
import Footer from './_components/footer';

const prompt = Prompt({
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
});

export const metadata = {
  title: 'Real Char.',
  description:
    'Create, customize and talk to your AI Character/Companion in realtime',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en' className='dark'>
      <body className={prompt.className}>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
