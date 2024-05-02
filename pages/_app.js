import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/react";

function MyApp({ Component, pageProps }) {
  return (
<<<<<<< HEAD
    <main>
=======
    <main className={`${GeistSans.className} ${GeistMono.className}`} >
>>>>>>> parent of 5f7c7ca (modify font)
      <Component {...pageProps} />
      <Analytics />
    </main>
  );
}

export default MyApp;
