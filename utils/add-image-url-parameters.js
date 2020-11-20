const numberMax = 16384
const isSizeValid = (number) =>
  number && Number.isInteger(number) && number > 0 && number < numberMax

const addImageUrlParameters = (url, pluginOptions) => {
  const {imagesMaxWidth, imagesMaxHeight, imagesCrop} = pluginOptions
  const maxWidth = isSizeValid(imagesMaxWidth) && `w${imagesMaxWidth}`
  const maxHeight = isSizeValid(imagesMaxHeight) && `h${imagesMaxHeight}`
  const crop = imagesCrop && imagesCrop === true && "c"
  const optionsArray = [maxWidth, maxHeight, crop].filter((option) => option)
  return `${url}${optionsArray.length > 0 ? "=" + optionsArray.join("-") : ""}`
}

module.exports = {
  addImageUrlParameters,
}
