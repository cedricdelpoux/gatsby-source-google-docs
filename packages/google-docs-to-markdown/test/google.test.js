import {beforeEach, expect, test, vi} from "vitest"

import {fetchDocument, fetchMarkdown} from "../google.js"
import {getAuth} from "../lib/auth.js"

const {mockGet, mockDocs} = vi.hoisted(() => {
  const mockGet = vi.fn()

  return {mockGet, mockDocs: vi.fn(() => ({documents: {get: mockGet}}))}
})

vi.mock("../lib/auth.js", () => ({getAuth: vi.fn()}))
vi.mock("@googleapis/docs", () => ({docs: mockDocs}))

const document = {
  title: "Home",
  body: {
    content: [
      {
        paragraph: {
          elements: [{textRun: {content: "Hello\n", textStyle: {}}}],
          paragraphStyle: {namedStyleType: "NORMAL_TEXT"},
        },
      },
    ],
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  getAuth.mockResolvedValue("env-auth")
  mockGet.mockResolvedValue({data: document})
})

test("fetches a document with the credentials of the environment", async () => {
  await expect(fetchDocument("1Tn1dCbIc")).resolves.toBe(document)

  expect(mockDocs).toHaveBeenCalledWith({version: "v1", auth: "env-auth"})
  expect(mockGet).toHaveBeenCalledWith({documentId: "1Tn1dCbIc"})
})

test("fetches a document with the given client", async () => {
  await fetchDocument("1Tn1dCbIc", {auth: "client"})

  expect(getAuth).not.toHaveBeenCalled()
  expect(mockDocs).toHaveBeenCalledWith({version: "v1", auth: "client"})
})

test("throws on an empty response", async () => {
  mockGet.mockResolvedValue({})

  await expect(fetchDocument("1Tn1dCbIc")).rejects.toThrow("Empty Data")
})

test("fetches a document as markdown", async () => {
  await expect(
    fetchMarkdown("1Tn1dCbIc", {frontmatter: {title: "Home"}})
  ).resolves.toBe("---\ntitle: Home\n---\n\nHello\n")
})
