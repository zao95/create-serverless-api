import { APIGatewayEvent, Context } from 'aws-lambda'
import fs from 'fs'
import { createResponse } from '../modules/utils'

export const handler = async (event: APIGatewayEvent, context: Context) => {
    let { fruit, count } = event.queryStringParameters as any
    count === undefined && (count = 1)
    const basket = fs.readFileSync('./modules/basket.json', 'utf-8')
    const basketJson = JSON.parse(basket)
    if (basketJson[fruit] >= count) {
        const response = createResponse({
            statusCode: 200,
            body: {
                message: `Take ${count} ${fruit}.`,
            },
        })

        return response
    } else {
        const response = createResponse({
            statusCode: 400,
            body: {
                message: `There's no fruit like that.`,
            },
        })

        return response
    }
}
