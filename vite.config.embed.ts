import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Build config for the embeddable widget bundle
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/embed/index.tsx"),
      name: "A11yWidget",
      fileName: "a11y-widget",
      formats: ["iife"],
    },
    outDir: "dist-embed",
    rollupOptions: {
      output: {
        // Ensure all code is bundled into a single file
        inlineDynamicImports: true,
      },
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
