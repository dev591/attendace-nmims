/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                nmims: {
                    primary: '#D50000', // NMIMS Red
                    secondary: '#333333',
                    light: '#F8F9FA',
                    border: '#E9ECEF',
                },
                status: {
                    good: '#16A34A', // Green
                    warning: '#CA8A04', // Yellow/Gold
                    danger: '#DC2626', // Red
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            boxShadow: {
                'card': '0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
            }
        },
    },
    plugins: [],
}
