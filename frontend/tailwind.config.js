/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        border: "var(--border-color)",
        // Custom color palette - Minimal Vercel Inspired
        vercel: {
          // Dark theme colors
          dark: {
            bg: "#0a0a0a", // Background primary
            "bg-secondary": "#141414", // Background secondary
            surface: "#1a1a1a", // Card/Surface
            border: "#262626", // Border subtle
            hover: "#222222", // Hover state (slightly lighter than surface)
            text: "#ffffff", // Text primary
            "text-secondary": "#a3a3a3", // Text secondary
            "text-tertiary": "#666666", // Text tertiary
          },
          // Light theme colors (Keeping existing for now, or could align)
          light: {
            bg: "#FFFFFF",
            surface: "#FAFAFA",
            border: "#EAEAEA",
            hover: "#F5F5F5",
            text: "#000000",
            "text-secondary": "#666666",
          },
          // Accent colors
          accent: {
            blue: "#0070F3", // Vercel Blue
            "blue-hover": "#0051B2",
            green: "#21C55D",
            red: "#FF4545",
            yellow: "#F5A623",
            purple: "#7928CA",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        "vercel-sm": "0 2px 4px rgba(0,0,0,0.1)",
        "vercel-md": "0 4px 8px rgba(0,0,0,0.12)",
        "vercel-lg": "0 8px 16px rgba(0,0,0,0.15)",
      },
      borderRadius: {
        vercel: "8px",
      },
      animation: {
        'gradient-x': 'gradient-x 3s ease infinite',
        'blob': 'blob 7s infinite',
        'fade-in': 'fade-in 1s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'blob': {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};
