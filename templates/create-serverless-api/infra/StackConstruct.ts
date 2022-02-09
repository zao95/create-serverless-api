import { Construct, App, Tags } from '@aws-cdk/core'
import CommonStack from './stacks/CommonStack'
import UploadS3Stack from './stacks/UploadS3'

interface props {
    swagger: any
}
class StackConstruct extends Construct {
    constructor(scope: App, id: string, props: props) {
        super(scope, id)

        const CommonStackObj = new CommonStack(
            scope,
            `${props.swagger.info.title}MainStack`,
            {
                env: {
                    region: props.swagger.info['x-cdk-region'],
                },
                swagger: props.swagger,
                stackName: `${props.swagger.info.title}MainStack`,
            }
        )

        const uploads3 = new UploadS3Stack(
            scope,
            `${props.swagger.info.title}CreateBucketStack`,
            {
                env: {
                    region: props.swagger.info['x-cdk-region'],
                },
                swagger: props.swagger,
                stackName: `${props.swagger.info.title}CreateBucketStack`,
            }
        )
        Tags.of(CommonStackObj).add('project', props.swagger.info.title)
        Tags.of(uploads3).add('project', props.swagger.info.title)
    }
}

export default StackConstruct
