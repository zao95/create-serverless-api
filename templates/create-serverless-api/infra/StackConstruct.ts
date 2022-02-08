import { Construct, App, Tags } from '@aws-cdk/core'
import setting from './setting'
import CommonStack from './stacks/CommonStack'
import UploadS3Stack from './stacks/UploadS3'

interface props {
    swagger: any
}
class StackConstruct extends Construct {
    constructor(scope: App, id: string, props: props) {
        super(scope, id)

        const CommonStackObj = new CommonStack(scope, `${props.swagger.info.title}Stack`, {
            env: setting.envKR,
            swagger: props.swagger,
        })

        const uploads3 = new UploadS3Stack(scope, 'uploads3', {
            env: setting.envKR,
            swagger: props.swagger,
            stackName: 'template-s3'
        })
        Tags.of(CommonStackObj).add('project', props.swagger.info.title)
        Tags.of(uploads3).add('project', props.swagger.info.title)
    }
}

export default StackConstruct
