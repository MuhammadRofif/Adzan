/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/frontend/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Palet ramah anak: biru langit (sky bawaan Tailwind), hijau mint, kuning matahari
        mint: {
          50: '#effef8',
          100: '#d7fcee',
          200: '#b2f5dc',
          300: '#7deac4',
          400: '#43d6a6',
          500: '#1bbd8c',
          600: '#0f9971',
          700: '#0f7a5c',
          800: '#11614b',
          900: '#10503f',
        },
        sun: {
          50: '#fffbea',
          100: '#fff3c4',
          200: '#ffe78a',
          300: '#ffd54a',
          400: '#ffc21f',
          500: '#f9a706',
          600: '#dd7f02',
          700: '#b75906',
        },
        dark: {
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        heading: ['"Baloo 2"', 'Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Bayangan "mainan": tegas di bawah, cocok untuk tombol & kartu anak
        toy: '0 4px 0 0 rgba(15, 23, 42, 0.08), 0 8px 24px -8px rgba(14, 116, 144, 0.25)',
        'toy-sky': '0 4px 0 0 #0369a1',
        'toy-mint': '0 4px 0 0 #0f7a5c',
        'toy-sun': '0 4px 0 0 #b75906',
      },
    },
  },
  plugins: [],
};
