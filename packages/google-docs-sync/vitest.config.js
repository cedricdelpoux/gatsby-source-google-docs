import {configDefaults, defineConfig} from "vitest/config"

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, ".claude/**"],
    coverage: {
      include: ["index.js", "lib/**"],
      reporter: ["text"],
    },
  },
})
