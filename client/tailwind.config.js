/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-primary': 'var(--bg-primary, #0f172a)',
                'bg-secondary': 'var(--bg-secondary, #1e293b)',
                'bg-card': 'var(--bg-card, rgba(30, 41, 59, 0.8))',
                'bg-header': 'var(--bg-header, rgba(15, 23, 42, 0.85))',
                'text-primary': 'var(--text-primary, #f8fafc)',
                'text-secondary': 'var(--text-secondary, #94a3b8)',
                'accent': {
                    DEFAULT: 'var(--accent, #a855f7)',
                    hover: 'var(--accent-hover, #9333ea)',
                    glow: 'var(--accent-glow, rgba(168, 85, 247, 0.5))',
                },
                'glass-border': 'var(--glass-border, rgba(255, 255, 255, 0.08))',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'radial-glow': "var(--radial-glow)",
            },
        },
    },
    plugins: [],
}

