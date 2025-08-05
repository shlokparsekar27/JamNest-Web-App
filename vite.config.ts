// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // This line is now correct

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()], // This line is now correct
})