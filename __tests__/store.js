const {mkdtemp, mkdir, readdir, rm, writeFile} = require("fs/promises")
const {tmpdir} = require("os")
const {join} = require("path")

const {createStore} = require("../utils/store")

let dir
let store

beforeEach(async () => {
  dir = join(await mkdtemp(join(tmpdir(), "google-docs-")), ".google-docs")
  store = createStore({dir})
})

afterEach(async () => {
  await rm(dir, {recursive: true, force: true})
})

const writeImage = async (documentId, fileName) => {
  await mkdir(store.imagesDirectory(documentId), {recursive: true})
  await writeFile(join(store.imagesDirectory(documentId), fileName), "image")
}

describe("documents", () => {
  test("gives nothing back for a document it does not hold", async () => {
    expect(await store.readDocument("1Tn1dCbIc")).toBeNull()
  })

  test("gives a document back with the time it was modified at", async () => {
    await store.init({})
    await store.writeDocument({
      id: "1Tn1dCbIc",
      modifiedTime: "2026-09-07T10:00:00.000Z",
      document: {title: "Home"},
    })

    expect(await store.readDocument("1Tn1dCbIc")).toEqual({
      modifiedTime: "2026-09-07T10:00:00.000Z",
      document: {title: "Home"},
    })
  })

  test("reports a file it cannot parse instead of fetching everything again", async () => {
    await store.init({})
    await store.writeDocument({id: "1Tn1dCbIc", document: {}})
    await writeFile(join(dir, "documents", "1Tn1dCbIc.json"), "{")

    await expect(store.readDocument("1Tn1dCbIc")).rejects.toThrow(
      "is not valid JSON"
    )
  })

  test("keeps an id from naming a file outside of the store", async () => {
    await store.init({})
    await store.writeDocument({id: "../../escaped", document: {}})

    // Whatever the id holds, it names a file inside the store and nowhere else
    expect(await readdir(join(dir, "documents"))).toEqual(["-..-escaped.json"])
  })
})

describe("images", () => {
  test("gives the images of a document back by object id", async () => {
    await writeImage("1Tn1dCbIc", "kix.abc123.png")

    expect(await store.readImages("1Tn1dCbIc")).toEqual(
      new Map([["kix.abc123", "kix.abc123.png"]])
    )
  })

  test("gives nothing back for a document without images", async () => {
    expect(await store.readImages("1Tn1dCbIc")).toEqual(new Map())
  })
})

describe("init", () => {
  test("keeps what a previous run stored", async () => {
    await store.init({imagesParams: ""})
    await store.writeDocument({id: "1Tn1dCbIc", document: {title: "Home"}})
    await writeImage("1Tn1dCbIc", "kix.abc123.png")

    await createStore({dir}).init({imagesParams: ""})

    expect(await store.readDocument("1Tn1dCbIc")).not.toBeNull()
    expect(await store.readImages("1Tn1dCbIc")).toEqual(
      new Map([["kix.abc123", "kix.abc123.png"]])
    )
  })

  test("drops the images when the images options changed", async () => {
    await store.init({imagesParams: ""})
    await store.writeDocument({id: "1Tn1dCbIc", document: {title: "Home"}})
    await writeImage("1Tn1dCbIc", "kix.abc123.png")

    await createStore({dir}).init({imagesParams: "=w512"})

    // The size is part of the URL: the files on disk are not the ones the
    // site asks for anymore, but the documents holding them are untouched
    expect(await store.readImages("1Tn1dCbIc")).toEqual(new Map())
    expect(await store.readDocument("1Tn1dCbIc")).not.toBeNull()
  })

  test("drops everything a store of another version left behind", async () => {
    await mkdir(dir, {recursive: true})
    await writeFile(join(dir, "state.json"), JSON.stringify({version: 0}))
    await store.writeDocument({id: "1Tn1dCbIc", document: {title: "Home"}})

    await store.init({})

    expect(await store.readDocument("1Tn1dCbIc")).toBeNull()
  })
})

describe("prune", () => {
  test("forgets the documents that are not in the folder anymore", async () => {
    await store.init({})
    await store.writeDocument({id: "kept", document: {}})
    await store.writeDocument({id: "removed", document: {}})
    await writeImage("kept", "kix.abc123.png")
    await writeImage("removed", "kix.def456.png")

    await store.prune(["kept"])

    expect(await store.readDocument("kept")).not.toBeNull()
    expect(await store.readImages("kept")).toEqual(
      new Map([["kix.abc123", "kix.abc123.png"]])
    )
    expect(await store.readDocument("removed")).toBeNull()
    expect(await store.readImages("removed")).toEqual(new Map())
  })
})
