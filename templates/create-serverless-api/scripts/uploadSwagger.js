const path = require('path')
const fs = require('fs/promises')
const AWS = require('aws-sdk')
const { readFileSync } = require('fs-extra')
const { camelCaseToDash } = require('./utils')
const chalk = require('chalk')

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
        const outputDataPath = path.join(
            process.cwd(),
            '.serverless',
            'output.json'
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

        const outputData = await fs.readFile(outputDataPath)
        const data = {}
        Object.values(JSON.parse(outputData, 'utf-8')).forEach((stack) => {
            Object.keys(stack).forEach((outputKey) => {
                data[outputKey] = stack[outputKey]
            })
        })

        const s3Domain = data.bucketRegionalDomainName
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
    } catch (e) {
        throw new Error(e)
    }
}

const printResult = async () => {
    try {
        const outputDataPath = path.join(
            process.cwd(),
            '.serverless',
            'output.json'
        )

        const outputData = await fs.readFile(path.join(outputDataPath), 'utf-8')

        const data = {}
        Object.values(JSON.parse(outputData)).forEach((stack) => {
            Object.keys(stack).forEach((outputKey) => {
                data[outputKey] = stack[outputKey]
            })
        })

        const s3Domain = data.bucketRegionalDomainName
        const apiEndpoint = data.apiEndpoint

        const apiDocumentURL = `https://${s3Domain}/index.html`

        const content = [
            `${chalk.blue('Project API Document')}: ${chalk.blue(
                apiDocumentURL
            )}`,
            `${chalk.blue('API Endpoint')}: ${chalk.blue(apiEndpoint)}`,
        ]

        return content
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
        await loadProcess('uploadApiDocument', uploadApiDocument)
        const contents = await loadProcess('printResult', printResult)

        console.info('')
        console.info('')
        console.info('')
        console.info('')
        console.info('')
        console.info('')
        console.info('')
        console.info('')
        console.info('')
        console.info('')
        console.info('')
        console.info('')
        console.info('')
        console.info('')
        console.info('')
        console.info('')
        console.info('')
        console.info('')
        console.info('')
        console.info('')
        console.info(`${chalk.blue('▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒')}`)
        console.info(`${chalk.blue('▒▒                                 ▒▒')}`)
        console.info(`${chalk.blue('▒▒  Create Serverless API Scripts  ▒▒')}`)
        console.info(`${chalk.blue('▒▒                                 ▒▒')}`)
        console.info(`${chalk.blue('▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒')}`)
        console.info('')
        console.info(
            `${chalk.blue('The project deployment was successfully executed.')}`
        )
        console.info('')
        console.info(`${chalk.blue('Use api using the output results below.')}`)
        console.info('')
        for (const content of contents) {
            console.info(content)
        }
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}

;(async () => await uploadSwagger())()
