import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "WanderLens - AI-Powered Personal Travel Co-Pilot",
  description: "Ditch planning fatigue. WanderLens designs personalized, immersive, and culturally sensitive itineraries across India using AI. Experience travel built around your persona.",
  keywords: "travel co-pilot, AI itinerary planner, India tourism, spiritual tourism, luxury heritage tours, custom trip designer, WanderLens, gobro",
  openGraph: {
    title: "WanderLens - Your AI Travel Co-Pilot",
    description: "Immersive discovery, personalized planning, and seamless simulated bookings for Indian adventures.",
    images: [{ url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80" }],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${plusJakartaSans.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-midnight-obsidian text-text-body">
        {children}
      </body>
    </html>
  );
}
