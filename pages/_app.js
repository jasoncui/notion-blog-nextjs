import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "../context/ThemeContext";

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <main>
        <Component {...pageProps} />
        <Analytics />
      </main>
    </ThemeProvider>
  );
}

export default MyApp;
