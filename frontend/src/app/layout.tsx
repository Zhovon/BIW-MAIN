import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Beauty Intelligent Wellness",
  description:
    "A premium clinic operations platform for CRM, sales, revenue, costs, branches, employees, and payroll.",
  icons: {
    icon: "/biw-logo.jpeg",
    shortcut: "/biw-logo.jpeg",
    apple: "/biw-logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable}`}>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
