const numberMax = 16384
const isSizeValid = (number) =>
  number && Number.isInteger(number) && number > 0 && number < numberMax

const getImageUrlParameters = (pluginOptions) => {
  const {imagesOptions} = pluginOptions

  if (!imagesOptions) return ""

  const {width, height, crop} = imagesOptions
  const widthParam = isSizeValid(width) && `w${width}`
  const heightParam = isSizeValid(height) && `h${height}`
  const cropParam = crop && crop === true && "c"
  const optionsArray = [widthParam, heightParam, cropParam].filter(Boolean)

  if (optionsArray.length === 0) return ""

  return `=${optionsArray.join("-")}`
}

module.exports = {
  getImageUrlParameters,
}
