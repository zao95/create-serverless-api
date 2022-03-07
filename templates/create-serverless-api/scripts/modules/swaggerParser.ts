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

	const { info: { title } } = swagger
	// console.log('sdsdsdsd: ', title)
	if (title === undefined) {
		throw new Error('project title is undefined.')
	}
	
	let resourceTree = {}
	for (const { info, resources } of resourceInfos){
		for (const methodKey in info){
			const method = info[methodKey]

			let treePeeker: any = null
			let next = resourceTree
			let lastResource = ''
			for (const resource of resources) {
				treePeeker = next
				
				let resourceKey = resource
				if (resource.match(/^\{.+\}$/)) {
					resourceKey = '{path}'
				}
				if(!treePeeker[resourceKey]){
					treePeeker[resourceKey] = { children: {}, methods: {}, alias: resource.replace('{', '').replace('}', '') }
				}
				next = treePeeker[resourceKey].children
				lastResource = resourceKey
			}

			treePeeker[lastResource].methods[methodKey] = JSON.parse(JSON.stringify(method))
			treePeeker[lastResource].methods[methodKey].name = 
			`${title}${methodKey.replace(/\b[a-z]/, letter => letter.toUpperCase())}${
				resources.slice(1, resources.length)
				.map(str => 
					str.replace(/\{/g, '').replace(/\}/g, '')
					.replace(/\b[a-z]/, letter => letter.toUpperCase())
				)
				.join('')
			}`
		}
	}
	// console.log(JSON.stringify(resourceTree, null, 4))
	return resourceTree
}

export default {
	parse,
}