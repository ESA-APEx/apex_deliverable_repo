import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      // Keep TanStack Start pointing at src/server.ts for SSR error handling.
      server: { entry: "server" },
    }),
    tanstackRouter({ target: "react" }),
    react(),
    tsConfigPaths(),
    tailwindcss(),
  ],
});
