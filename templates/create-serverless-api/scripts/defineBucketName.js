const SwaggerParser = require('@apidevtools/swagger-parser')
const fs = require('fs-extra')
const prompts = require('prompts')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { camelCaseToDash } = require('./utils')

const defineBucketName = async () => {
    const dataPath = path.join(process.cwd(), 'infra', 'projectData.json')
    try {
        await fs.access(dataPath)
    } catch (e) {
        const response = await prompts({
            type: 'confirm',
            name: 'value',
            message: `Is this your first time running this project?\nIf not, please import /infra/projectData.json from the existing project execution environment to the current environment and run it again.`,
        })
        if (response.value === false) {
            process.exit(1)
        }

        const swagger = await SwaggerParser.parse(
            path.join(process.cwd(), 'swagger.yaml')
        )
        try {
            await fs.ensureFile(dataPath)
        } catch (e) {
            console.error('File creation inside "/infra" directory failed.')
            process.exit(1)
        }
        const bucketName = `${camelCaseToDash(swagger.info.title)}-${uuidv4()}`
        await fs.writeJson(dataPath, {
            bucketName: bucketName,
        })

        console.log('Initial setting data was successfully generated.')
    }
}

;(async () => await defineBucketName())()
