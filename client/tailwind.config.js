/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-primary': '#0f172a',
                'bg-secondary': '#1e293b',
                'bg-card': 'rgba(30, 41, 59, 0.75)',
                'text-primary': '#f8fafc',
                'text-secondary': '#94a3b8',
                'accent': {
                    DEFAULT: '#38bdf8',
                    hover: '#0ea5e9',
                    glow: 'rgba(56, 189, 248, 0.5)',
                },
                'glass-border': 'rgba(255, 255, 255, 0.08)',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'radial-glow': "radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(129, 140, 248, 0.15) 0px, transparent 50%)",
            },
        },
    },
    plugins: [],
}
