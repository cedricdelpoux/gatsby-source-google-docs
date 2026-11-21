import {defineConfig} from "vitest/config"

export default defineConfig({
  test: {
    coverage: {
      include: ["index.js", "google.js", "lib/**"],
      reporter: ["text"],
    },
  },
})
