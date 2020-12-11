const numberMax = 16384
const isSizeValid = (number) =>
  number && Number.isInteger(number) && number > 0 && number < numberMax

const getImageUrlParameters = (pluginOptions) => {
  const {imagesOptions} = pluginOptions

  if (!imagesOptions) return ""

  const {maxWidth, maxHeight, crop} = imagesOptions
  const widthParam = isSizeValid(maxWidth) && `w${maxWidth}`
  const heightParam = isSizeValid(maxHeight) && `h${maxHeight}`
  const cropParam = crop && crop === true && "c"
  const optionsArray = [widthParam, heightParam, cropParam].filter(Boolean)

  if (optionsArray.length === 0) return ""

  return `=${optionsArray.join("-")}`
}

module.exports = {
  getImageUrlParameters,
}
