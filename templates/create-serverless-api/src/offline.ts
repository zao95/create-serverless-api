import SwaggerParser from '@apidevtools/swagger-parser'
import express from 'express'
import cors from 'cors'

const app = express()

const AsyncWrapper = (fn: any) => (req: any, res: any, next: any) => {
    fn(req, res, next)
}

const handler = (req: any, res: any, next: any) => {
    console.log('req.url', req.url)
    console.log('req.params', req.params)
    console.log('req.query', req.query)
    console.log('req.body', req.body)

    res.set('Content-Type', 'application/JSON')
    res.set('Access-Control-Allow-Origin', '*')

    res.status(200)
    res.send({
        data: 'q',
    })
}

app.use(cors())
app.use(
    express.urlencoded({
        extended: true,
    })
)
app.use(express.json())
app.use(AsyncWrapper(handler))

app.listen(8080, () =>
    console.log(`Example app listening at http://localhost:8080`)
)

// const offline = () => {
//     SwaggerParser.parse('./swagger.yaml').then((swagger) => {
//         for (const [path, methods] of Object.entries(swagger.paths) as any[]) {
//             console.log('path', path)
//             for (const [method, api] of Object.entries(methods)) {
//                 console.log('method', method)
//                 console.log('api', api)
//             }
//         }
//     })
// }
