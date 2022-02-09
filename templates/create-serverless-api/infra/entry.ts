#!/usr/bin/env node

import { App } from '@aws-cdk/core'
import SwaggerParser from '@apidevtools/swagger-parser'
import setting from './setting'
import StackConstruct from './StackConstruct'

SwaggerParser.parse('./swagger.yaml').then((swagger) => {
    const app = new App()
    new StackConstruct(app, `${swagger.info.title}Construct`, { swagger })
    app.synth()
})
