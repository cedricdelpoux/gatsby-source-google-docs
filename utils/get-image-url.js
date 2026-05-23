const numberMax = 16384
const isSizeValid = (number) =>
  number && Number.isInteger(number) && number > 0 && number < numberMax

const getImageUrlParameters = (pluginOptions) => {
  const {imagesOptions} = pluginOptions

  if (!imagesOptions) return ""

  const {width, height, crop} = imagesOptions
  const params = []

  if (isSizeValid(width)) params.push(`w${width}`)
  if (isSizeValid(height)) params.push(`h${height}`)
  if (crop === true) params.push("c")

  return params.length ? `=${params.join("-")}` : ""
}

const stripGoogleImageSizeParams = (googleImageUrl) => {
  const sizeDelimiterIndex = googleImageUrl.lastIndexOf("=s")
  const lastSlashIndex = googleImageUrl.lastIndexOf("/")

  if (sizeDelimiterIndex > lastSlashIndex) {
    return googleImageUrl.slice(0, sizeDelimiterIndex)
  }

  return googleImageUrl
}

const getImageUrl = (urlWithParams, pluginOptions) => {
  const [googleImageUrl, googleImageParams] = urlWithParams.split("?")
  const imageUrlParams = getImageUrlParameters(pluginOptions)
  const cleanedGoogleImageUrl = imageUrlParams
    ? stripGoogleImageSizeParams(googleImageUrl)
    : googleImageUrl

  // URLs format: https://...googleusercontent.com/docsz/[IMAGE_ID][IMAGE_PARAMS]?key=[AUTHORIZATION_KEY]
  return `${cleanedGoogleImageUrl}${imageUrlParams}${
    googleImageParams ? `?${googleImageParams}` : ""
  }`
}

module.exports = {
  getImageUrl,
  getImageUrlParameters,
}
