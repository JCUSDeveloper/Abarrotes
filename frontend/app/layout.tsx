import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventario | Abarrotes",
  description: "Panel de control de inventario para tienda de abarrotes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
