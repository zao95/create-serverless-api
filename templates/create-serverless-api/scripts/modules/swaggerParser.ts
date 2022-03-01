import SwaggerParser from '@apidevtools/swagger-parser'

export const parse = async (swaggerPath: string): Promise<any> => { // method key와 resource key가 구분되게끔 분리.
    const swagger = await SwaggerParser.parse(swaggerPath)
    if(!swagger?.paths){
        throw 'no paths definition'
    }

    const paths = JSON.parse(JSON.stringify(swagger.paths))
	const resourceInfos = Object.keys(paths).map(pathKey => {
		const resourcePath = pathKey.endsWith('/') ? `root${pathKey}` : `root${pathKey}/`
		const resources = resourcePath.split('/')
		resources.pop()
		return { info: paths[pathKey], resources }
	})
	
	let resourceTree = {}
	for (const { info, resources } of resourceInfos){
		for (const methodKey in info){
			const method = info[methodKey]
			console.log(method, resources)

			let treePeeker: any = resourceTree
			for (const resource of resources) {
				const resourceKey = resource.match(/^\{.+\}$/) ? '{path}' : resource
				if(!treePeeker[resourceKey]){
					treePeeker[resourceKey] = { children: {}, methods: {} }
				}
				treePeeker = treePeeker[resourceKey]
			}

			treePeeker[methodKey] = JSON.parse(JSON.stringify(method))
			treePeeker[methodKey].name = 
			`${methodKey}${
				resources.slice(1, resources.length)
				.map(str => 
					str.replace(/\{/g, '').replace(/\}/g, '')
					.replace(/\b[a-z]/, letter => letter.toUpperCase())
				)
				.join('')
			}`
		}
		// pathKey.endsWith('/')
		// const resourceArray = pathKey.replace('/', 'root/').split('/')
		// console.log('key: ', resourceArray)
	}
	console.log(JSON.stringify(resourceTree, null, 4))
	return resourceTree
}

export default {
	parse,
}