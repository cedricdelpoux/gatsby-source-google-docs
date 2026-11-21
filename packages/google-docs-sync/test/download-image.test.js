import {afterEach, beforeEach, expect, test, vi} from "vitest"

import {mkdtemp, readFile, readdir, rm} from "node:fs/promises"
import {tmpdir} from "node:os"
import {join} from "node:path"

import {downloadImage} from "../lib/download-image.js"

// The retry delays resolve at once
vi.mock("node:timers/promises", () => ({setTimeout: vi.fn(async () => {})}))

const URL = "https://lh7-rt.googleusercontent.com/docsz/AD_4nXabc123?key=Ab12Cd"

const image = (contentType, body = "image-bytes") =>
  new Response(body, {headers: {"content-type": contentType}})

let directory
let fetchOriginal

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "gsgd-images-"))
  fetchOriginal = global.fetch
  global.fetch = vi.fn()
})

afterEach(async () => {
  global.fetch = fetchOriginal
  await rm(directory, {recursive: true, force: true})
})

test("writes the image and returns its file name", async () => {
  global.fetch.mockResolvedValue(image("image/png"))

  const fileName = await downloadImage({url: URL, directory, name: "cover"})

  expect(fileName).toBe("cover.png")
  expect(await readFile(join(directory, fileName), "utf8")).toBe("image-bytes")
})

test("takes the extension from the response, not from the URL", async () => {
  // Google serves document images without any extension, and
  // `gatsby-plugin-sharp` dispatches on the extension of the File node
  global.fetch.mockResolvedValue(image("image/jpeg; charset=binary"))

  expect(await downloadImage({url: URL, directory, name: "cover"})).toBe(
    "cover.jpg"
  )
})

test("retries a failed download", async () => {
  global.fetch
    .mockRejectedValueOnce(new Error("socket hang up"))
    .mockResolvedValueOnce(image("image/png"))

  const fileName = await downloadImage({url: URL, directory, name: "cover"})

  expect(global.fetch).toHaveBeenCalledTimes(2)
  expect(fileName).toBe("cover.png")
})

test("gives up after three attempts, naming the image and the reason", async () => {
  global.fetch.mockResolvedValue(new Response("", {status: 503}))

  await expect(
    downloadImage({url: URL, directory, name: "cover"})
  ).rejects.toThrow(`Unable to download "${URL}": 503`)

  expect(global.fetch).toHaveBeenCalledTimes(3)
})

test("does not ask again for an image Google refuses", async () => {
  global.fetch.mockResolvedValue(new Response("", {status: 404}))

  await expect(
    downloadImage({url: URL, directory, name: "cover"})
  ).rejects.toMatchObject({status: 404})

  expect(global.fetch).toHaveBeenCalledTimes(1)
})

test("asks again for an image Google rate limits", async () => {
  global.fetch
    .mockResolvedValueOnce(new Response("", {status: 429}))
    .mockResolvedValueOnce(image("image/png"))

  await downloadImage({url: URL, directory, name: "cover"})

  expect(global.fetch).toHaveBeenCalledTimes(2)
})

test("refuses a response that is not an image", async () => {
  // An expired image URL answers with an HTML error page
  global.fetch.mockResolvedValue(image("text/html"))

  await expect(
    downloadImage({url: URL, directory, name: "cover"})
  ).rejects.toThrow(`unsupported image type "text/html"`)
})

test("leaves no half-written file behind", async () => {
  // Sharp would fail on it much later, with a far less obvious message
  global.fetch.mockImplementation(async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("half"))
        controller.error(new Error("connection reset"))
      },
    })

    return new Response(body, {headers: {"content-type": "image/png"}})
  })

  await expect(
    downloadImage({url: URL, directory, name: "cover"})
  ).rejects.toThrow("connection reset")

  expect(await readdir(directory)).toEqual([])
})
