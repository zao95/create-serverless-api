import SwaggerParser from '@apidevtools/swagger-parser'
import path from 'path'
import http from 'http'
import { mappingLambdaEvent, mappingLambdaContext } from './modules/map'
import swaggerParser from './modules/swaggerParser'

const offline = async () => {
    const swaggerPath = path.join(process.cwd(), 'swagger.yaml')
    const swagger = await SwaggerParser.parse(swaggerPath)
    if(!swagger?.paths){
        throw 'no paths definition'
    }

    const paths = JSON.parse(JSON.stringify(swagger.paths))
    const resourceTree = await swaggerParser.parse(swaggerPath)

    http.createServer(async (req, res) => {
        let response = { statusCode: 200, body: '' }
        try{
            const [pathUrlWithStage, queryString]: any = req.url?.split('?')
	        const pathUrl = pathUrlWithStage?.replace('/development', '')

            const method = req?.method || ''
            const resourcePath = pathUrl.endsWith('/') ? `root${pathUrl}` : `root${pathUrl}/`
            const resources = resourcePath.split('/')
            resources.pop()

            let pathParameters: {[key: string]: any} = {}
            let pathResources = []
            let peeker: { children: {[key: string]: any}, methods: {[key: string]: any} } = { children: resourceTree, methods: {} }
            for (const resource of resources) {
                if(!peeker){
                    throw new Error('404: path not found')
                }
                const nowPeekerNode = peeker.children
                const resourceKeys = Object.keys(nowPeekerNode)
                if (resourceKeys.includes('{path}') && resourceKeys.length !== 1) {
                    throw new Error('path parameter resource must unique in same level.')
                }

                let node = nowPeekerNode[resource]
                let nextResource = resource
                if (node !== undefined) {
                    nextResource = resource
                    pathResources.push(nextResource)
                } else {
                    nextResource = '{path}'
                    const key = nowPeekerNode[nextResource].alias
                    pathParameters[key] = resource
                    pathResources.push(key)
                }
                peeker = nowPeekerNode[nextResource]
                
            }
            pathResources = pathResources.map(resource => resource.replace(/\b[a-z]/, (letter: string) => letter.toUpperCase()))
            pathResources[0] = method?.toLowerCase()
            const functionName = pathResources.join('')

            const methodInfo = peeker.methods[method?.toLowerCase()]
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
            
            const event = { ...(await mappingLambdaEvent(req, pathParameters)) }
            const newContext = mappingLambdaContext(functionName)
            // console.log([event, newContext])
            response = await apiModule(event, newContext)
            
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