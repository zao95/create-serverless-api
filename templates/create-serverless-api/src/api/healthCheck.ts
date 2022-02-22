import { APIGatewayEvent, Context } from 'aws-lambda'
import { createResponse } from '../modules/utils'

export const handler = async (event: APIGatewayEvent, context: Context) => {
    const response = createResponse({
        statusCode: 200,
        body: {
            health: true,
        },
    })

    return response
}
