import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
    plugins: [
        react(),
        // visualizer({
        // open: true, // Open the report automatically in your browser
        // filename: "bundle-analysis.html", // Output file
        // }),
    ],
    base: "/mrange-shader-rework/",
    server: {
        port: 3000,
        open: true,
        watch: {
            usePolling: true,
        },
    },
});
