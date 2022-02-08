
import { App, RemovalPolicy, Stack } from '@aws-cdk/core'
import { Bucket } from '@aws-cdk/aws-s3'


class UploadS3Stack extends Stack {
    constructor(scope: App, key: string, props: any) {
        super(scope, key, props)

		new Bucket(this, `${props.swagger.info.title}-bucket`, {
            bucketName: props.swagger.info['x-cdk-s3-bucket-name'],
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        })
    }
}

export default UploadS3Stack