// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["*.html", "js/*.js"],
  theme: {
    extend: {
      colors: {
        "primary-blue": "#3B82F6",
        "primary-dark": "#111827",
        "card-dark": "#1F2937",
        "text-light": "#F3F4F6",
        "text-secondary": "#9CA3AF",
        "border-dark": "#374151",
        "success-green": "#10B981",
        "danger-red": "#EF4444",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
