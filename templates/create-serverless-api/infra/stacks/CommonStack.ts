import { App, RemovalPolicy, Stack, StackProps } from '@aws-cdk/core'
import {
    Cors,
    Deployment,
    EndpointType,
    MethodLoggingLevel,
    RestApi,
    Stage,
} from '@aws-cdk/aws-apigateway'
import convertSwaggerToRestApiModule from '../modules/convertSwaggerToRestApi'
import { LayerVersion, Runtime, S3Code } from '@aws-cdk/aws-lambda'
import { SubnetType } from '@aws-cdk/aws-ec2'
import { Bucket } from '@aws-cdk/aws-s3'
import { camelCaseToDash, changeToUppercaseFirstLetter } from '../utils/utils'
import { join } from 'path'
import { readFileSync } from 'fs-extra'
import path from 'path'

interface IProps extends StackProps {
    swagger: any
}
class CommonStack extends Stack {
    public constructor(scope: App, key: string, props: IProps) {
        super(scope, key, props)

        const bucketName = camelCaseToDash(
            JSON.parse(
                readFileSync(
                    path.join(process.cwd(), 'infra', 'projectData.json'),
                    'utf-8'
                )
            ).bucketName
        )

        const bucket = Bucket.fromBucketName(
            this,
            `${props.swagger.info.title}Bucket`,
            bucketName
        )

        const layersByLambda = JSON.parse(
            readFileSync(join(__dirname, '../../layers.json'), {
                encoding: 'utf-8',
            })
        )
        const layerSet = new Set(Object.values(layersByLambda))
        const layers = new Map()
        for (const layerName of layerSet) {
            layers.set(
                layerName,
                new LayerVersion(
                    this,
                    `${props.swagger.info.title}Layer-${layerName}`,
                    {
                        code: new S3Code(bucket, `${layerName}.zip`),
                        compatibleRuntimes: [
                            Runtime.NODEJS_12_X,
                            Runtime.NODEJS_14_X,
                        ],
                    }
                )
            )
        }
        for (const lambdaName in layersByLambda) {
            layersByLambda[lambdaName] = layers.get(layersByLambda[lambdaName])
        }

        const apiGateway = new RestApi(
            this,
            `${props.swagger.info.title}CdkApiGateway`,
            {
                restApiName: `${changeToUppercaseFirstLetter(
                    props.swagger.info.title
                )}_API_Gataway`,
                description: `${props.swagger.info.title} api gateways`,
                endpointTypes: [EndpointType.REGIONAL],
                failOnWarnings: true, // Rollback when error on deploy process
                defaultCorsPreflightOptions: {
                    allowOrigins: Cors.ALL_ORIGINS,
                    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTION'],
                },
                deploy: true,
                deployOptions: {
                    stageName: process.env.INFRA_ENV,
                    description: `stage in ${process.env.INFRA_ENV} environment`,
                    variables: {
                        APP_ENV: process.env.INFRA_ENV,
                    } as { [key: string]: any },
                    tracingEnabled: true, // X-Ray enable
                    dataTraceEnabled: true, // CloudWatch log enable
                    loggingLevel: MethodLoggingLevel.INFO, // CloudWatch logging level
                    throttlingBurstLimit: 10, // maximum process count at same time
                    throttlingRateLimit: 10, // maximum request count per second
                },
            }
        )
        convertSwaggerToRestApiModule(this, {
            apiGateway: apiGateway,
            swagger: props.swagger,
            layersByLambda: layersByLambda,
            lambdaProps: {
                key: `${props.swagger.info.title}Functions`,
                runtime: Runtime.NODEJS_14_X,
                allowPublicSubnet: true,
                environment: {
                    APP_ENV: process.env.INFRA_ENV,
                } as { [key: string]: string },
                vpcSubnets: {
                    subnetType: SubnetType.PUBLIC,
                },
            },
        })
    }
}

export default CommonStack
