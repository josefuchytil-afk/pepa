import "./globals.css";

export const metadata = {
  title: "Pepa checklist",
  description: "Denní checklist",
};

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
