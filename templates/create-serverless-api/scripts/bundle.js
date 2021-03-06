const path = require('path')
const SwaggerParser = require('@apidevtools/swagger-parser')
const childProcess = require('child_process')
const util = require('util')
const fs = require('fs/promises')
const { createHmac } = require('crypto')
const os = require('os')

const exec = util.promisify(childProcess.exec)

const serverlessPath = path.join(process.cwd(), '.serverless')
const distPath = path.join(serverlessPath, 'dist')
const srcPath = path.join(process.cwd(), 'src')
const tempPath = path.join(distPath, 'temp')
const layerPath = path.join(distPath, 'layers')
const commonModulePath = path.join(srcPath, 'modules')

const extractDependencies = async () => {
    const packageJsonData = await fs.readFile(
        path.join(process.cwd(), 'package.json')
    )
    const packageJson = Buffer.from(packageJsonData).toString('utf-8')
    const packageInfo = JSON.parse(packageJson)
    const dependencies = packageInfo?.dependencies || {}
    return dependencies
}

const extractLambdaInfos = async (swagger) => {
    const {
        paths,
        info: { title },
    } = swagger

    const lambdaInfos = {}
    for (const pathKey in paths) {
        const uris = pathKey
            .replace('/', '')
            .split('/')
            .map((str) =>
                str
                    .replace(/[a-z]/, (letter) => letter.toUpperCase())
                    .replace(/_[a-z]/, (letter) =>
                        letter.replace(/\_/, '').toUpperCase()
                    )
                    .replace(/\{/g, '')
                    .replace(/\}/g, '')
            )
        const pathInfo = paths[pathKey]
        for (const method in pathInfo) {
            const info = pathInfo[method]

            const lambdaName = title.concat(
                method.replace(/[a-z]/, (letter) => letter.toUpperCase()),
                uris.join('')
            )
            const additionalLibrary = info['x-cdk-additional-library'] || []

            const handler = path.join(srcPath, info['x-cdk-lambda-handler'])
            const handlerPath = handler.replace(path.extname(handler), '.ts')

            lambdaInfos[lambdaName] = { additionalLibrary, handlerPath }
        }
    }

    return lambdaInfos
}

const bundle = async () => {
    await fs.rm(distPath, { recursive: true, force: true })
    await fs.mkdir(layerPath, { recursive: true })
    await fs.mkdir(tempPath, { recursive: true })

    const swagger = await SwaggerParser.parse(
        path.join(process.cwd(), 'swagger.yaml')
    )

    const dependencies = await extractDependencies()
    const lambdaInfos = await extractLambdaInfos(swagger)

    console.info('gen directories...')
    const commonDependencies = { ...dependencies }
    for (const lambdaName in lambdaInfos) {
        const { handlerPath, additionalLibrary } = lambdaInfos[lambdaName]

        const lambdaTempPath = path.join(tempPath, lambdaName)
        const copiedPath = path.join(
            lambdaTempPath,
            path.relative(srcPath, handlerPath)
        )

        await fs.mkdir(path.join(lambdaTempPath), { recursive: true })
        await copyForce(handlerPath, copiedPath)

        const modulePath = path.join(lambdaTempPath, 'modules')
        await fs.mkdir(modulePath)

        await copy(commonModulePath, modulePath)

        for (const libraryName of additionalLibrary) {
            delete commonDependencies[libraryName]
        }
    }

    console.info('gen layers...')
    const libraryCase = []
    for (const lambdaName in lambdaInfos) {
        const { additionalLibrary } = lambdaInfos[lambdaName]

        const useDependencies = { ...commonDependencies }
        for (const libraryName of additionalLibrary) {
            useDependencies[libraryName] = dependencies[libraryName]
        }
        const jsonUseDependencies = JSON.stringify(useDependencies)
        if (!libraryCase.includes(jsonUseDependencies)) {
            libraryCase.push(jsonUseDependencies)
        }
        lambdaInfos[lambdaName].layerCaseName = jsonToHash(jsonUseDependencies)
    }

    for await (const oneCase of libraryCase) {
        const layerCaseName = jsonToHash(oneCase)
        const layerCasePath = path.join(layerPath, layerCaseName)
        const nodePath = path.join(layerCasePath, 'nodejs')
        await fs.mkdir(nodePath, { recursive: true })

        const useDependencies = JSON.parse(oneCase)
        for (const libraryName in useDependencies) {
            const version = useDependencies[libraryName]
            await exec(
                `npm i --prefix ${nodePath} ${libraryName}@${version}`
            )
        }

        const fileCnt = (await fs.readdir(nodePath)).length

        if (fileCnt === 0) {
            await fs.mkdir(nodePath, { recursive: true })
            await fs.writeFile(path.join(nodePath, 'blank.json'), 'blank')
        }
        const zipPath = path.join(layerPath, `${layerCaseName}.zip`)
        
        const platform = os.platform()
        let zipCommand = 'zip'
        if(platform==='win32'){
            zipCommand = 'tar.exe -a -c -f'
        }
        await exec(
            `cd ${layerCasePath} && ${zipCommand} ${zipPath} nodejs/*`
        )
        await fs.rm(layerCasePath, { force: true, recursive: true })
    }

    const layerJson = {}
    for (const lambdaName in lambdaInfos) {
        const useCase = lambdaInfos[lambdaName].layerCaseName
        layerJson[lambdaName] = useCase
    }

    await fs.writeFile(
        path.join(serverlessPath, 'layers.json'),
        JSON.stringify(layerJson)
    )
}

const jsonToHash = string =>
    createHmac('sha256', 'library').update(string).digest('hex').slice(0, 20)

const copy = async (src, dest) => {
    const stat = await fs.lstat(src)
    if (stat.isDirectory()) {
        await fs.mkdir(dest, { recursive: true })
        const dirs = await fs.readdir(src)
        for await (const dir of dirs) {
            const [srcPath, destPath] = [
                path.join(src, dir),
                path.join(dest, dir),
            ]
            await copy(srcPath, destPath)
        }
    } else {
        await fs.copyFile(src, dest)
    }
}

const copyForce = async (src, dest) => {
    const { dir } = path.parse(dest)
    await fs.mkdir(dir, { recursive: true })
    await fs.copyFile(src, dest)
}

bundle().catch((e) => {
    throw e
})
