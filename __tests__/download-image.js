const {mkdtemp, readFile, readdir, rm} = require("fs/promises")
const {tmpdir} = require("os")
const {join} = require("path")

const {downloadImage} = require("../utils/download-image")

const URL = "https://lh7-rt.googleusercontent.com/docsz/AD_4nXabc123?key=Ab12Cd"

const image = (contentType, body = "image-bytes") =>
  new Response(body, {headers: {"content-type": contentType}})

let directory
let fetchOriginal

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "gsgd-images-"))
  fetchOriginal = global.fetch
  global.fetch = jest.fn()
})

afterEach(async () => {
  global.fetch = fetchOriginal
  jest.useRealTimers()
  await rm(directory, {recursive: true, force: true})
})

/**
 * Fake the retry delays only: the file streams need their own scheduling to
 * keep running.
 */
const useFakeRetryDelays = () =>
  jest.useFakeTimers({
    doNotFake: ["nextTick", "queueMicrotask", "setImmediate", "clearImmediate"],
  })

/**
 * Let the retry delays elapse without actually waiting for them: yield to the
 * real work of an attempt, then jump over the delay it asks for, until the
 * download settles. The outcome is captured up front, so a rejection is never
 * left unhandled in between.
 */
const runWithoutDelays = async (promise) => {
  let pending = true
  const settled = promise.then(
    (value) => () => value,
    (error) => () => {
      throw error
    }
  )

  settled.then(() => {
    pending = false
  })

  while (pending) {
    await new Promise((resolve) => setImmediate(resolve))
    await jest.advanceTimersByTimeAsync(10000)
  }

  return (await settled)()
}

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
  useFakeRetryDelays()
  global.fetch
    .mockRejectedValueOnce(new Error("socket hang up"))
    .mockResolvedValueOnce(image("image/png"))

  const fileName = await runWithoutDelays(
    downloadImage({url: URL, directory, name: "cover"})
  )

  expect(global.fetch).toHaveBeenCalledTimes(2)
  expect(fileName).toBe("cover.png")
})

test("gives up after three attempts, naming the image and the reason", async () => {
  useFakeRetryDelays()
  global.fetch.mockResolvedValue(new Response("", {status: 404}))

  await expect(
    runWithoutDelays(downloadImage({url: URL, directory, name: "cover"}))
  ).rejects.toThrow(`Unable to download "${URL}": 404`)

  expect(global.fetch).toHaveBeenCalledTimes(3)
})

test("refuses a response that is not an image", async () => {
  // An expired image URL answers with an HTML error page
  useFakeRetryDelays()
  global.fetch.mockResolvedValue(image("text/html"))

  await expect(
    runWithoutDelays(downloadImage({url: URL, directory, name: "cover"}))
  ).rejects.toThrow(`unsupported image type "text/html"`)
})

test("leaves no half-written file behind", async () => {
  // Sharp would fail on it much later, with a far less obvious message
  useFakeRetryDelays()
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
    runWithoutDelays(downloadImage({url: URL, directory, name: "cover"}))
  ).rejects.toThrow("connection reset")

  expect(await readdir(directory)).toEqual([])
})
