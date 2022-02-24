import SwaggerParser from '@apidevtools/swagger-parser'
import path from 'path'
import http from 'http'
import { mappingEvent, context } from './modules/map'

const offline = async () => {
    const swaggerPath = path.join(process.cwd(), 'swagger.yaml')
    const swagger = await SwaggerParser.parse(swaggerPath)
    if(!swagger?.paths){
        throw 'no paths definition'
    }

    const { paths } = swagger
    http.createServer(async (req, res) => {
        console.log('req: ', req)
        // console.log('res: ', res)
        let response = { statusCode: 200, body: '' }
        try{
            const event = { ...(await mappingEvent(req)) }
            console.log('req2: ', event)

            const { resource: pathUrl, httpMethod: method } = event
            const urlInfo = paths[pathUrl]
            if(!urlInfo){
                throw new Error('404: url definition not found')
            }

            const methodInfo = urlInfo[method?.toLowerCase()]
            if(!methodInfo){
                throw new Error('404: method definition not found')
            }

            const handlerInfo = methodInfo['x-cdk-lambda-handler']
            if(!handlerInfo){
                throw new Error('404: handler definition not found')
            }

            const apiPath = path.join(process.cwd(), 'src', handlerInfo)
            const { ext } = path.parse(apiPath)

            let apiModule = null
            try{
                apiModule = require(apiPath.replace(ext, ''))[ext.replace('.', '')]
            } catch (e) {
                throw new Error('404: module not found')
            }
            
            const newContext = { ...context }
            response = await apiModule(event, newContext)
            console.log(response)
            
        } catch (e: any) {
            const eStr = e.toString().replace('Error: ', '')
            console.error(e)
            let statusCode = Number(eStr.slice(0, 3))
            if(isNaN(statusCode)){
                statusCode = 500
            }
            response.statusCode = statusCode
        } finally {
            res.statusCode = response.statusCode
            res.end(response.body)
        }
    }).listen(8080);
    // for (const [path, methods] of Object.entries(swagger.paths) as any[]) {
    //     console.log('path', path)
    //     for (const [method, api] of Object.entries(methods)) {
    //         console.log('method', method)
    //         console.log('api', api)
    //     }
    // }

    // 1. 파싱
    // 2. request event, context 생성
    // 3. api path 탐색 및 참조
    // 4. response = api(event, context)
    // 5. response 반환
}

offline()