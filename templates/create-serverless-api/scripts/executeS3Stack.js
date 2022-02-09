const SwaggerParser = require('@apidevtools/swagger-parser')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const spawn = require('child_process').spawn

const execute = async (command) => {
    return new Promise((resolve, reject) => {
        ls = spawn(command)
        ls.stdout.on('data', function (data) {
            console.log('stdout: ' + data.toString())
        })

        ls.stderr.on('data', function (data) {
            console.log('stderr: ' + data.toString())
            reject(false)
        })
        ls.on('exit', function (code) {
            console.log('child process exited with code ' + code.toString())
            resolve(true)
        })
    })
}

const executeS3Stack = async () => {
    try {
        return SwaggerParser.parse('./swagger.yaml').then(async (swagger) => {
            const cdkCommand = process.argv[2]
            const stackName = `${swagger.info.title}CreateBucketStack`
            const INFRA_ENV = process.env.INFRA_ENV
            const command = `cdk ${cdkCommand} ${stackName} --require-approval never --profile ${INFRA_ENV}`

            // await execute(command)
            const result = await exec(command)
            return result
        })
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

const main = async () => {
    try {
        const isMade = await loadProcess('executeS3Stack', executeS3Stack)
        if (!isMade) throw new Error('S3 stack 배포에 실패했습니다.')

        console.log('execute S3 Stack complete!')
    } catch (e) {
        console.error(e)
    }
}

;(async () => await main())()
