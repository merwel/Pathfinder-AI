import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { ConvexClientProvider } from "@/contexts/ConvexClientProvider";
import { MapProvider } from "@/contexts/MapProvider";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Pathfinder AI — Editorial AI Travel Planner & Itineraries",
    template: "%s | Pathfinder AI",
  },
  description:
    "Curate luxury, magazine-quality custom travel itineraries powered by AI, real-time weather, Google Maps place recommendations, expense tracking, and seamless group collaboration.",
  keywords: ["AI travel planner", "vacation itinerary", "trip planner", "travel guide", "group trip expenses"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${playfair.variable} ${sans.variable} font-sans min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-terracotta-500/20 selection:text-terracotta-700 dark:selection:text-terracotta-300`}
        >
          <NextTopLoader
            color="#DD5928"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
          />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConvexClientProvider>
              <MapProvider>
                <div className="relative flex min-h-screen flex-col">
                  {children}
                </div>
                <Toaster position="top-right" richColors closeButton />
              </MapProvider>
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
