import { APIGatewayEvent, Context } from 'aws-lambda'
import fs from 'fs'
import { createResponse } from '../modules/utils'

export const handler = async (event: APIGatewayEvent, context: Context) => {
    const basket = fs.readFileSync('./modules/basket.json', 'utf-8')
    const basketJson = JSON.parse(basket)
    if (basketJson) {
        const response = createResponse({
            statusCode: 200,
            body: {
                basket: basketJson,
            },
        })

        return response
    } else {
        const response = createResponse({
            statusCode: 400,
            body: {
                message: `There is no basket.`,
            },
        })

        return response
    }
}
