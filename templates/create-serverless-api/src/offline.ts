import SwaggerParser from '@apidevtools/swagger-parser'

const offline = () => {
    SwaggerParser.parse('./swagger.yaml').then((swagger) => {
        console.log(swagger)
        console.log(JSON.stringify(swagger.paths))
    })
}
offline()
