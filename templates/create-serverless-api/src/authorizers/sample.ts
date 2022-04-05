
import { AuthResponse as AuthResType, APIGatewayRequestAuthorizerEvent, APIGatewayTokenAuthorizerEvent } from 'aws-lambda'

export type AuthResponse = AuthResType
export interface APIGatewayTokenRequestAuthorizerEvent extends Omit<APIGatewayRequestAuthorizerEvent, 'type'>, APIGatewayTokenAuthorizerEvent { }

export const invoke = async (event: APIGatewayTokenRequestAuthorizerEvent): Promise<AuthResponse> => {
    let effect = 'Allow'
    return {
        principalId: 'user',
        policyDocument: {
            Version: '2012-10-17',
            Statement: [{
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: '*',
            },
            {
                Action: "logs:CreateLogGroup",
                Effect: effect,
                Resource: '*',
            },
            {
                Action: [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                Effect: effect,
                Resource: '*',
            }]
        },
    }
}
