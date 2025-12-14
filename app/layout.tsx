import type { Metadata } from "next";
import { Outfit } from "next/font/google"; // Using a premium font
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Travel Agency Dashboard",
  description: "Internal dashboard for vehicle and trip management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={outfit.className}>{children}</body>
    </html>
  );
}
