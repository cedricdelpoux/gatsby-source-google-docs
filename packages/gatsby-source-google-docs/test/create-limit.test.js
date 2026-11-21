import {expect, test} from "vitest"

import {setTimeout as delay} from "node:timers/promises"

import {createLimit} from "../utils/create-limit.js"

test("runs no more tasks at once than its count", async () => {
  const limit = createLimit(2)
  let runningCount = 0
  let maxRunningCount = 0

  const task = async () => {
    runningCount++
    maxRunningCount = Math.max(maxRunningCount, runningCount)
    await delay(5)
    runningCount--
  }

  await Promise.all(Array.from({length: 6}, () => limit(task)))

  expect(maxRunningCount).toBe(2)
})

test("starts the tasks in the order they were given", async () => {
  const limit = createLimit(1)
  const started = []

  await Promise.all(
    ["first", "second", "third"].map((name) =>
      limit(async () => started.push(name))
    )
  )

  expect(started).toEqual(["first", "second", "third"])
})

test("gives back the result of each task", async () => {
  const limit = createLimit(2)

  const results = await Promise.all([1, 2, 3].map((n) => limit(async () => n)))

  expect(results).toEqual([1, 2, 3])
})

test("rejects with the error of a failed task and goes on with the next", async () => {
  const limit = createLimit(1)
  const failed = limit(() => Promise.reject(new Error("403 Forbidden")))
  const next = limit(async () => "done")

  await expect(failed).rejects.toThrow("403 Forbidden")
  await expect(next).resolves.toBe("done")
})
