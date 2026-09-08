const {getImageIdsByUrl} = require("../utils/document-images")

const document = require("./documents/images.json")

describe("getImageIdsByUrl", () => {
  test("names every image of a document by the object holding it", () => {
    const url =
      document.inlineObjects["kix.4dmdp8b4zkkv"].inlineObjectProperties
        .embeddedObject.imageProperties.contentUri

    expect(getImageIdsByUrl(document)).toEqual(
      new Map([[url, "kix.4dmdp8b4zkkv"]])
    )
  })

  test("ignores an inline object that is not an image", () => {
    expect(
      getImageIdsByUrl({
        inlineObjects: {
          "kix.abc123": {inlineObjectProperties: {embeddedObject: {}}},
        },
      })
    ).toEqual(new Map())
  })

  test("tolerates a document without inline objects", () => {
    expect(getImageIdsByUrl({})).toEqual(new Map())
    expect(getImageIdsByUrl(undefined)).toEqual(new Map())
  })
})
