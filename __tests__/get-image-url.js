const {getImageUrl, getImageUrlParameters} = require("../utils/get-image-url")

describe("getImageUrl", () => {
  test("preserves existing params when no image options are set", () => {
    const url =
      "https://lh7-rt.googleusercontent.com/docsz/AD_4nXf4AcGhd7GTf-xVJQRVa-uaxvBhJk7kYnguHUvAaH3SzW9W0eeZTu1SkAvZ3rTH6tPCePHER_EOs5SIRGARYel1TP8TkLNc_-GEi5LrQLkfvQzSNtGbORt3CKKzD4T272bQWUU_ifHeujBAAsnM8k-igwSLYHZYcXsKCAfAxa7Akg=s2048?key=5y2JBHSp5FwSxB7TwnGwQg"

    expect(getImageUrl(url, {})).toBe(url)
  })

  test("replaces existing Google image size params when image options are provided", () => {
    const url =
      "https://lh7-rt.googleusercontent.com/docsz/AD_4nXf4AcGhd7GTf-xVJQRVa-uaxvBhJk7kYnguHUvAaH3SzW9W0eeZTu1SkAvZ3rTH6tPCePHER_EOs5SIRGARYel1TP8TkLNc_-GEi5LrQLkfvQzSNtGbORt3CKKzD4T272bQWUU_ifHeujBAAsnM8k-igwSLYHZYcXsKCAfAxa7Akg=s2048?key=5y2JBHSp5FwSxB7TwnGwQg"
    const options = {imagesOptions: {width: 1600, height: 800}}

    expect(getImageUrl(url, options)).toBe(
      "https://lh7-rt.googleusercontent.com/docsz/AD_4nXf4AcGhd7GTf-xVJQRVa-uaxvBhJk7kYnguHUvAaH3SzW9W0eeZTu1SkAvZ3rTH6tPCePHER_EOs5SIRGARYel1TP8TkLNc_-GEi5LrQLkfvQzSNtGbORt3CKKzD4T272bQWUU_ifHeujBAAsnM8k-igwSLYHZYcXsKCAfAxa7Akg=w1600-h800?key=5y2JBHSp5FwSxB7TwnGwQg"
    )
  })

  test("appends image params when no Google size suffix is present", () => {
    const url =
      "https://lh7-rt.googleusercontent.com/docsz/AD_4nXf4AcGhd7GTf-xVJQRVa-uaxvBhJk7kYnguHUvAaH3SzW9W0eeZTu1SkAvZ3rTH6tPCePHER_EOs5SIRGARYel1TP8TkLNc_-GEi5LrQLkfvQzSNtGbORt3CKKzD4T272bQWUU_ifHeujBAAsnM8k-igwSLYHZYcXsKCAfAxa7Akg?key=5y2JBHSp5FwSxB7TwnGwQg"
    const options = {imagesOptions: {width: 1600, height: 800}}

    expect(getImageUrl(url, options)).toBe(
      "https://lh7-rt.googleusercontent.com/docsz/AD_4nXf4AcGhd7GTf-xVJQRVa-uaxvBhJk7kYnguHUvAaH3SzW9W0eeZTu1SkAvZ3rTH6tPCePHER_EOs5SIRGARYel1TP8TkLNc_-GEi5LrQLkfvQzSNtGbORt3CKKzD4T272bQWUU_ifHeujBAAsnM8k-igwSLYHZYcXsKCAfAxa7Akg=w1600-h800?key=5y2JBHSp5FwSxB7TwnGwQg"
    )
  })

  test("appends image params with no query params present", () => {
    const url =
      "https://lh7-rt.googleusercontent.com/docsz/AD_4nXf4AcGhd7GTf-xVJQRVa-uaxvBhJk7kYnguHUvAaH3SzW9W0eeZTu1SkAvZ3rTH6tPCePHER_EOs5SIRGARYel1TP8TkLNc_-GEi5LrQLkfvQzSNtGbORt3CKKzD4T272bQWUU_ifHeujBAAsnM8k-igwSLYHZYcXsKCAfAxa7Akg"
    const options = {imagesOptions: {width: 1600, height: 800}}

    expect(getImageUrl(url, options)).toBe(
      "https://lh7-rt.googleusercontent.com/docsz/AD_4nXf4AcGhd7GTf-xVJQRVa-uaxvBhJk7kYnguHUvAaH3SzW9W0eeZTu1SkAvZ3rTH6tPCePHER_EOs5SIRGARYel1TP8TkLNc_-GEi5LrQLkfvQzSNtGbORt3CKKzD4T272bQWUU_ifHeujBAAsnM8k-igwSLYHZYcXsKCAfAxa7Akg=w1600-h800"
    )
  })
})

describe("getImageUrlParameters", () => {
  test("returns empty string with nonexistent image options", () => {
    expect(getImageUrlParameters({})).toBe("")
  })

  test("returns empty string when image options are invalid", () => {
    const options = {
      imagesOptions: {
        width: -1,
        height: 0,
        crop: false,
      },
    }

    expect(getImageUrlParameters(options)).toBe("")
  })

  test("returns a string with valid dimensions and crop enabled", () => {
    const options = {
      imagesOptions: {
        width: 1600,
        height: 800,
        crop: true,
      },
    }

    expect(getImageUrlParameters(options)).toBe("=w1600-h800-c")
  })
})
