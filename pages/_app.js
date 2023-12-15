import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/react";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';


function MyApp({ Component, pageProps }) {
  return (
    <main className={`${GeistSans.className} ${GeistMono.className}`} >
      <Component {...pageProps} />
      <Analytics />
    </main>
  );
}

export default MyApp;
