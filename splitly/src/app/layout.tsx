import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import {Toaster} from "react-hot-toast";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Splitly",
    description: "Easy to use checkx splitting app",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
        <body className="min-h-full flex flex-col">
        <Toaster
            position="top-center"
            toastOptions={{
                style: {
                    background: '#1e1e1e',
                    color: '#f0f0f0',
                    border: '1px solid #2a2a2a',
                    fontSize: '13px',
                    fontFamily: "'DM Mono', monospace",
                },
                success: {
                    iconTheme: {
                        primary: '#c8f060',
                        secondary: '#0d0d0d',
                    },
                },
            }}
        />
        {children}
        </body>
        </html>
    );
}
