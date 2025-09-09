// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["*.html", "js/*.js"],
  theme: {
    extend: {
      colors: {
        "primary-blue": "#3B82F6",
        "background-light": "#F3F4F6",
        "text-dark": "#1F2937",
        "card-background": "#ffffff",
        "sidebar-background": "#1F2937",
        "border-color": "#D1D5DB",
        "input-background": "#ffffff",
        "success-green": "#10B981",
        "danger-red": "#EF4444",
        "secondary-gray": "#9CA3AF",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
