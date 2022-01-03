import { Construct, App, Tags } from '@aws-cdk/core'
import setting from './setting'
import CommonStack from './stacks/CommonStack'

interface props {
    swagger: any
}
class StackConstruct extends Construct {
    constructor(scope: App, id: string, props: props) {
        super(scope, id)

        const CommonStackObj = new CommonStack(scope, setting.stack.key, {
            env: setting.envKR,
            swagger: props.swagger,
        })
        Tags.of(CommonStackObj).add('project', 'Slipy')
    }
}

export default StackConstruct
