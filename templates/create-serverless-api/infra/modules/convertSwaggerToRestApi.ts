import { Construct } from '@aws-cdk/core'
import {
    RestApi,
    LambdaIntegration,
    JsonSchemaType,
    RequestValidator,
} from '@aws-cdk/aws-apigateway'
import {
    Function,
    Code,
    Tracing,
    FunctionProps,
    LayerVersion,
} from '@aws-cdk/aws-lambda'
import {
    changeToUppercaseFirstLetter,
    getParameterType,
    isEmpty,
} from '../utils/utils'

const jsonSchemaTypeDictionary: any = {
    array: JsonSchemaType.ARRAY,
    boolean: JsonSchemaType.BOOLEAN,
    integer: JsonSchemaType.INTEGER,
    null: JsonSchemaType.NULL,
    number: JsonSchemaType.NUMBER,
    object: JsonSchemaType.OBJECT,
    string: JsonSchemaType.STRING,
}
interface ILambdaProps extends Omit<FunctionProps, 'code' | 'handler'> {
    key: string
}

interface IProps {
    apiGateway: RestApi
    swagger: any
    layersByLambda: { [key: string]: LayerVersion }
    lambdaProps: ILambdaProps
}

const convertSwaggerToRestApi = (
    scope: Construct,
    { apiGateway, swagger, layersByLambda, lambdaProps }: IProps
) => {
    let paths = Object.keys(swagger.paths)

    paths.forEach((pathName) => {
        const resource = apiGateway.root.resourceForPath(pathName)
        const methods = Object.keys(swagger.paths[pathName])

        methods.forEach((methodName) => {
            const apiData = swagger.paths[pathName][methodName]
            const lambdaId =
                swagger.info.title +
                changeToUppercaseFirstLetter(methodName) +
                (pathName === '/' ? '' : changeToUppercaseFirstLetter(pathName))
            const lambda = new Function(scope, lambdaId, {
                functionName: lambdaId,
                description: apiData['description'],
                code: Code.fromAsset(`./.serverless/dist/api/${lambdaId}`),
                handler: apiData['x-cdk-lambda-handler'],
                tracing: Tracing.ACTIVE,
                layers: [layersByLambda[lambdaId]],
                ...lambdaProps,
            })

            let hasRequestParameter: boolean = false
            let hasRequestBody: boolean = false
            let integrationParameters: any = undefined
            let methodParameters: any = undefined
            let modelSchema: any = undefined

            if (apiData['parameters'] && apiData['parameters'].length) {
                const parameters: any[] = apiData['parameters']
                integrationParameters = {}
                methodParameters = {}

                parameters.forEach((parameter, idx) => {
                    const parameterType = getParameterType(parameter['in'])
                    if (parameterType === 'body') {
                        const requiredArray = []
                        hasRequestBody = true
                        modelSchema = {}
                        const schema = parameter['schema']
                        modelSchema.title = lambdaId
                        modelSchema.description = apiData['description']
                        modelSchema.type = jsonSchemaTypeDictionary[schema.type]
                        if (!isEmpty(schema.properties)) {
                            modelSchema.properties = {}
                            for (const property in schema.properties) {
                                const propertyType =
                                    schema.properties[property].type
                                modelSchema.properties[property] = {
                                    type: jsonSchemaTypeDictionary[
                                        propertyType
                                    ],
                                }
                                if (
                                    schema.properties[property].required ===
                                    true
                                )
                                    requiredArray.push(property)
                            }
                        }
                        if (requiredArray.length >= 1) {
                            modelSchema.required = requiredArray
                        }
                    } else {
                        hasRequestParameter = true
                        integrationParameters[
                            `integration.request.${parameterType}.${parameter['name']}`
                        ] = `method.request.${parameterType}.${parameter['name']}`
                        methodParameters[
                            `method.request.${parameterType}.${parameter['name']}`
                        ] = parameter.required ?? false
                        methodParameters[
                            `method.request.${parameterType}.${parameter['name']}`
                        ] = parameter.required ?? false
                    }
                })
            }

            let model = undefined
            if (modelSchema) {
                model = apiGateway.addModel(`${lambdaId}Model`, {
                    modelName: `${lambdaId}Model`,
                    description: apiData['description'],
                    contentType: apiData['produces'][0],
                    schema: modelSchema,
                })
            }

            let requestValidator: any = undefined
            if (hasRequestBody || hasRequestParameter) {
                requestValidator = new RequestValidator(
                    scope,
                    `${lambdaId}RequestValidator`,
                    {
                        restApi: apiGateway,
                        requestValidatorName: `${lambdaId}RequestValidator`,
                        validateRequestBody: hasRequestBody,
                        validateRequestParameters: hasRequestParameter,
                    }
                )
            }

            resource.addMethod(
                methodName,
                new LambdaIntegration(lambda, {
                    requestParameters: integrationParameters,
                }),
                {
                    ...(modelSchema && {
                        requestModels: {
                            [apiData['produces'][0]]: model,
                        },
                    }),
                    ...(requestValidator && {
                        requestValidator: requestValidator,
                    }),
                    requestParameters: methodParameters,
                }
            )
        })
    })
}

export default convertSwaggerToRestApi
