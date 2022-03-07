const path = require('path')
const fs = require('fs/promises')
const AWS = require('aws-sdk')
const { readFileSync } = require('fs-extra')
const { camelCaseToDash } = require('./utils')

const credentials = new AWS.SharedIniFileCredentials({
    profile: process.env.INFRA_ENV,
})
AWS.config.credentials = credentials

const saveSwagger = async () => {
    try {
        const swaggerPath = path.join(process.cwd(), 'swagger.yaml')

        const bucketName = camelCaseToDash(
            JSON.parse(
                readFileSync(
                    path.join(process.cwd(), 'infra', 'projectData.json'),
                    'utf-8'
                )
            ).bucketName
        )
        const s3 = new AWS.S3()

        const file = await fs.readFile(path.join(swaggerPath))
        await s3
            .upload({
                Bucket: bucketName,
                Key: 'swagger.yaml',
                Body: file,
                ContentType: 'text/plain',
            })
            .promise()
    } catch (e) {
        throw new Error(e)
    }
}

const uploadApiDocument = async () => {
    try {
        const s3DomainDataPath = path.join(
            process.cwd(),
            '.serverless',
            's3Domain.json'
        )
        const templatePath = path.join(
            process.cwd(),
            'scripts',
            'template.html'
        )

        const bucketName = camelCaseToDash(
            JSON.parse(
                readFileSync(
                    path.join(process.cwd(), 'infra', 'projectData.json'),
                    'utf-8'
                )
            ).bucketName
        )
        const s3 = new AWS.S3()

        const s3DomainData = await fs.readFile(
            path.join(s3DomainDataPath),
            'utf-8'
        )
        const s3Domain = Object.values(JSON.parse(s3DomainData))[0]
            .bucketRegionalDomainName
        const swaggerPath = `https://${s3Domain}/swagger.yaml`
        const template = await fs.readFile(path.join(templatePath), 'utf-8')
        const file = template.replace('$URL_INSERT$', swaggerPath)

        await s3
            .upload({
                Bucket: bucketName,
                Key: 'index.html',
                Body: file,
                ContentType: 'text/html',
            })
            .promise()

        return `https://${s3Domain}/index.html`
    } catch (e) {
        throw new Error(e)
    }
}

const timer = () => {
    const timer = setInterval(() => {
        process.stdout.write('.')
    }, 1000)
    const clearTimer = () => {
        clearInterval(timer)
    }
    return clearTimer
}

const loadProcess = async (name, func, params = []) => {
    const time = timer()
    process.stdout.write(`${name} start...`)
    try {
        const result = await func(...params)
        process.stdout.write(`complete\n`)
        return result
    } catch (e) {
        process.stdout.write(`error\n`)
        return Promise.reject(Error(e))
    } finally {
        time()
    }
}

const uploadSwagger = async () => {
    try {
        await loadProcess('saveSwagger', saveSwagger)
        const url = await loadProcess('uploadApiDocument', uploadApiDocument)

        console.log('upload swagger to s3 complete!')
        console.log()
        console.log(`Project API Document: ${url}`)
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}

;(async () => await uploadSwagger())()
