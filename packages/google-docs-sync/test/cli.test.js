import {beforeEach, expect, test, vi} from "vitest"

import {runCli} from "../lib/cli.js"
import {syncGoogleDocs} from "../lib/sync.js"

vi.mock("../lib/sync.js", () => ({syncGoogleDocs: vi.fn()}))

const logger = {info: vi.fn(), warn: vi.fn(), error: vi.fn()}

beforeEach(() => {
  vi.clearAllMocks()
  syncGoogleDocs.mockResolvedValue({
    documents: [{}, {}],
    fetchedCount: 1,
    imagesCount: 3,
    downloadedImagesCount: 2,
  })
})

test("syncs the folder given as an option", async () => {
  await runCli(
    [
      "--folder",
      "folder-id",
      "--output-dir",
      "docs",
      "--cache-dir",
      "cache",
      "--extension",
      "mdx",
      "--skip-images",
      "--debug",
    ],
    {env: {}, logger}
  )

  expect(syncGoogleDocs).toHaveBeenCalledWith({
    logger,
    folder: "folder-id",
    outputDir: "docs",
    cacheDir: "cache",
    extension: "mdx",
    skipImages: true,
    debug: true,
  })
})

test("falls back to the GOOGLE_DOCS_FOLDER variable", async () => {
  await runCli([], {env: {GOOGLE_DOCS_FOLDER: "env-folder"}, logger})

  expect(syncGoogleDocs.mock.calls[0][0].folder).toBe("env-folder")
})

test("prefers the option to the variable", async () => {
  await runCli(["--folder", "option"], {
    env: {GOOGLE_DOCS_FOLDER: "env-folder"},
    logger,
  })

  expect(syncGoogleDocs.mock.calls[0][0].folder).toBe("option")
})

test("reports what was synced", async () => {
  await runCli(["--folder", "folder-id"], {env: {}, logger})

  expect(logger.info).toHaveBeenCalledWith(
    "2 documents (1 fetched) and 3 images (2 downloaded)"
  )
})

test("prints the usage", async () => {
  await runCli(["--help"], {env: {}, logger})

  expect(syncGoogleDocs).not.toHaveBeenCalled()
  expect(logger.info.mock.calls[0][0]).toContain("Usage: google-docs-sync")
})

test("reads the environment of the process by default", async () => {
  vi.stubEnv("GOOGLE_DOCS_FOLDER", "process-folder")

  await runCli([], {logger})

  expect(syncGoogleDocs.mock.calls[0][0].folder).toBe("process-folder")
  vi.unstubAllEnvs()
})
