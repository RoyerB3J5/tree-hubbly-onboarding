import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: 'normal',
});


export const metadata: Metadata = {
  title: "Treehubly App",
  description: "Treehubly helps tree companies generate better leads, book more jobs, and scale with a structured growth ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${poppins.className} h-full antialiased overflow-x-hidden `}
    >
      <body className="font-family antialiased overflow-x-hidden bg-primary flex flex-col justify-center items-center w-full">{children}</body>
    </html>
  );
}
