import { App, RemovalPolicy, Stack } from '@aws-cdk/core'
import { Bucket } from '@aws-cdk/aws-s3'
import { readFileSync } from 'fs-extra'
import path from 'path'
import { camelCaseToDash } from '../utils/utils'

class UploadS3Stack extends Stack {
    constructor(scope: App, key: string, props: any) {
        super(scope, key, props)

        const bucketName = camelCaseToDash(
            JSON.parse(
                readFileSync(
                    path.join(process.cwd(), 'infra/data.json'),
                    'utf-8'
                )
            ).bucketName
        )

        new Bucket(this, `${props.swagger.info.title}-bucket`, {
            bucketName: bucketName,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        })
    }
}

export default UploadS3Stack
