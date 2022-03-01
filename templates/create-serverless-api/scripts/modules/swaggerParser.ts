import SwaggerParser from '@apidevtools/swagger-parser'

export const parse = async (swaggerPath: string): Promise<any> => {
    const swagger = await SwaggerParser.parse(swaggerPath)
    if(!swagger?.paths){
        throw 'no paths definition'
    }

    const paths = JSON.parse(JSON.stringify(swagger.paths))
	const resources = Object.keys(paths).map(pathKey => {
		const resourcePath = pathKey.endsWith('/') ? `root${pathKey}` : `root${pathKey}/`
		const resource = resourcePath.split('/')
		resource.pop()
		return { info: paths[pathKey], resource }
	})
	console.log('re: ', resources)
	// let resourceTree = {}

	for (const { info, resource } of resources){
		for (const methodKey in info){
			const method = 
		}
		pathKey.endsWith('/')
		const resourceArray = pathKey.replace('/', 'root/').split('/')
		console.log('key: ', resourceArray)
	}
}

export default {
	parse,
}