import Providers from "@/components/Providers";
import "./globals.css";

export const metadata = {
  title: "NextJS Chat App",
  description:
    "Discover a custom-built chat application powered by Next.js, offering seamless, real-time messaging and a clean, responsive design. This app leverages Next.js for optimized performance, with features like secure user authentication, customizable chat rooms, and fast server-side rendering. Built to prioritize both speed and user experience, this Next.js chat app is ideal for personal or professional use. Enjoy a streamlined, reliable communication platform that showcases the best of Next.js capabilities, with effortless database integration and modern UI features.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
