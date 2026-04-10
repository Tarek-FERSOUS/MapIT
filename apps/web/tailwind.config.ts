import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f4ff",
          100: "#e0e9fe",
          200: "#c7d2fe",
          500: "#1E40AF",
          600: "#1e3a8a",
          700: "#1e40af",
          900: "#0f172a"
        },
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155"
        },
        emerald: {
          500: "#10B981",
          600: "#059669"
        },
        amber: {
          500: "#F59E0B",
          600: "#d97706"
        },
        red: {
          500: "#ef4444",
          600: "#dc2626"
        }
      },
      spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "2.5rem",
        "3xl": "3rem"
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem"
      },
      typography: {
        DEFAULT: {
          css: {
            code: {
              backgroundColor: "#f3f4f6",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.25rem",
              fontSize: "0.9em"
            }
          }
        }
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};

export default config;
