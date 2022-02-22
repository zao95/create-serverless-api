export const isEmpty = (param: Object) => Object.keys(param).length === 0

export const changeToUppercaseFirstLetter = (strings: string): string => {
    return strings
        .replace(/\{|\}/g, '')
        .split(/\/|\_|\-/)
        .map(
            (string) =>
                string.slice(0, 1).toUpperCase() +
                string.slice(1, string.length)
        )
        .join('')
}

export const getParameterType = (swaggerIn: string): string => {
    if (swaggerIn === 'query') return 'querystring'
    else if (swaggerIn === 'path') return 'path'
    else if (swaggerIn === 'header') return 'header'
    else if (swaggerIn === 'body') return 'body'
    else
        throw new Error(
            `요청하신 api parameter 종류인 ${swaggerIn}을 찾을 수 없습니다.`
        )
}

export const camelCaseToDash = (str: string) =>
    str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
