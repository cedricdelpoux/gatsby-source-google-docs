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

const getImageUrl = (urlWithParams, pluginOptions) => {
  const [googleImageUrl, googleImageParams] = urlWithParams.split("?")
  const imageUrlParams = getImageUrlParameters(pluginOptions)

  // URLs format: https://...googleusercontent.com/docsz/[IMAGE_ID][IMAGE_PARAMS]?key=[AUTHORIZATION_KEY]
  return googleImageUrl + imageUrlParams + "?" + googleImageParams
}

module.exports = {
  getImageUrl,
  getImageUrlParameters,
}
