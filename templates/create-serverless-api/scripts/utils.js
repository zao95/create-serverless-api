const camelCaseToDash = (str) =>
    str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

module.exports = {
    camelCaseToDash,
}
