function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms)
  })
}

function reload(requestsPerInterval, interval, state) {
  const throughput = requestsPerInterval / interval
  const now = Date.now()
  const reloadTime = now - state.lastReload
  const reloadedRequests = reloadTime * throughput
  const newAvalableRequests = state.availableRequests + reloadedRequests

  return {
    ...state,
    lastReload: now,
    availableRequests: Math.min(newAvalableRequests, requestsPerInterval),
  }
}

function wait(requestsPerInterval, interval) {
  const timePerRequest = interval / requestsPerInterval

  let state = {
    lastReload: Date.now(),
    availableRequests: requestsPerInterval,
  }

  async function waitRequest(requests = 1) {
    if (requests > requestsPerInterval) {
      throw new Error(
        "Requests can not be greater than the number of requests per interval"
      )
    }

    state = reload(requestsPerInterval, interval, state)

    const requestsToWait = Math.max(0, requests - state.availableRequests)
    const wait = Math.ceil(requestsToWait * timePerRequest)

    state.availableRequests -= requests
    await sleep(wait)
    return wait
  }

  return waitRequest
}

exports.wait = wait
