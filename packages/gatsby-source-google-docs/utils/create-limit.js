/**
 * Return a function that runs the tasks it is given, `count` at most at once,
 * in the order they were given.
 *
 * @param {number} count
 */
const createLimit = (count) => {
  let runningCount = 0
  const queue = []

  const runNext = () => {
    if (runningCount >= count || queue.length === 0) return

    const {task, resolve, reject} = queue.shift()

    runningCount++
    Promise.resolve()
      .then(task)
      .then(resolve, reject)
      .finally(() => {
        runningCount--
        runNext()
      })
  }

  /**
   * @template T
   * @param {() => Promise<T>} task
   * @returns {Promise<T>}
   */
  return (task) =>
    new Promise((resolve, reject) => {
      queue.push({task, resolve, reject})
      runNext()
    })
}

export {createLimit}
