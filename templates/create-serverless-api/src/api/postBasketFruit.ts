import { APIGatewayEvent, Context } from 'aws-lambda'
import { createResponse } from '../modules/utils'

export const handler = async (event: APIGatewayEvent, context: Context) => {
    try {
        const { fruit } = event.pathParameters as any
        const { count } = event.body as any
        if (count >= 1) throw new Error('count is not a valid value.')

        const response = createResponse({
            statusCode: 200,
            body: {
                message: `Succeeded in putting ${count} ${fruit} in the basket.\n`,
            },
        })

        return response
    } catch (e: any) {
        const response = createResponse({
            statusCode: 400,
            body: {
                message: e.message,
            },
        })

        return response
    }
}
