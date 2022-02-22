export const camelCaseToDash = (str: string): string =>
    str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

interface ICreateResponse {
    statusCode: number
    body: any
}
export const createResponse = ({ statusCode, body }: ICreateResponse) => ({
    statusCode: statusCode,
    headers: {
        'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
        body,
    }),
})
