import {configDefaults, defineConfig} from "vitest/config"

export default defineConfig({
  test: {
    // Claude Code keeps its git worktrees there, with a copy of the tests
    exclude: [...configDefaults.exclude, ".claude/**"],
    coverage: {
      include: ["utils/**"],
      exclude: ["utils/generate-token.js"],
      reporter: ["text"],
    },
  },
})
