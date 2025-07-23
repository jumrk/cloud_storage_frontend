import "./globals.css";
import { Toaster } from "react-hot-toast";
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="google-site-verification"
          content="A3CxoLyJY5Lh3XPz3VwKPf8vPlYDAL6YutsUDTIhbRM"
        />
      </head>
      <body>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
