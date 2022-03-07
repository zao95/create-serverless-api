import { App, CfnOutput, RemovalPolicy, Stack } from '@aws-cdk/core'
import { Bucket, HttpMethods } from '@aws-cdk/aws-s3'
import { readFileSync } from 'fs-extra'
import path from 'path'
import { camelCaseToDash } from '../utils/utils'
const fs = require('fs-extra')

class UploadS3Stack extends Stack {
    constructor(scope: App, key: string, props: any) {
        super(scope, key, props)

        const bucketName = camelCaseToDash(
            JSON.parse(
                readFileSync(
                    path.join(process.cwd(), 'infra', 'projectData.json'),
                    'utf-8'
                )
            ).bucketName
        )

        const bucket = new Bucket(this, `${props.swagger.info.title}-bucket`, {
            bucketName: bucketName,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            publicReadAccess: true,
            cors: [
                {
                    allowedMethods: [HttpMethods.GET],
                    allowedOrigins: ['*'],
                },
            ],
        })

        new CfnOutput(this, 'bucketName', {
            value: bucket.bucketName,
            description: 'The name of the s3 bucket',
            exportName: 'bucketName',
        })
        new CfnOutput(this, 'bucketRegionalDomainName', {
            value: bucket.bucketRegionalDomainName,
            description: 'The regional domain name of the s3 bucket',
            exportName: 'bucketRegionalDomainName',
        })
    }
}

export default UploadS3Stack
