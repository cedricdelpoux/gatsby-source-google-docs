import GoogleOAuth2 from "google-oauth2-env-vars"
import {beforeEach, expect, test, vi} from "vitest"

import {generateToken, getAuth} from "../lib/auth.js"

const {mockGetAuth, mockGenerateEnvVars} = vi.hoisted(() => ({
  mockGetAuth: vi.fn(),
  mockGenerateEnvVars: vi.fn(),
}))

vi.mock("google-oauth2-env-vars", () => ({
  default: vi.fn(function () {
    this.getAuth = mockGetAuth
    this.generateEnvVars = mockGenerateEnvVars
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

test("builds a client from the GOOGLE_DOCS_TOKEN variable", async () => {
  mockGetAuth.mockResolvedValue("client")

  await expect(getAuth()).resolves.toBe("client")
  expect(GoogleOAuth2).toHaveBeenCalledWith({token: "GOOGLE_DOCS_TOKEN"})
})

test("generates a token that reads Google Docs and Google Drive", async () => {
  await generateToken()

  expect(GoogleOAuth2).toHaveBeenCalledWith({
    scope: [
      "https://www.googleapis.com/auth/documents.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
    ],
    token: "GOOGLE_DOCS_TOKEN",
    apis: ["docs.googleapis.com", "drive.googleapis.com"],
  })
  expect(mockGenerateEnvVars).toHaveBeenCalled()
})
