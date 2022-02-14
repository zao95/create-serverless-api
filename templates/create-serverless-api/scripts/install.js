const fs = require('fs/promises')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const existCheck = async (path) => {
    try {
        let directoryIsExist = null

        try {
            await fs.access(path)
            directoryIsExist = true
        } catch (e) {
            if (e.errno === -4058) directoryIsExist = false
            else throw new Error(e)
        }

        return directoryIsExist
    } catch (e) {
        throw new Error(e)
    }
}

const makeDirectory = async (directoryPath) => {
    try {
        let isSuccess = null

        if (await existCheck(directoryPath)) {
            isSuccess = true
        } else {
            await fs.mkdir(directoryPath, { recursive: true })
            isSuccess = true
        }
        if (!(await existCheck(directoryPath))) {
            isSuccess = false
        }

        return isSuccess
    } catch (e) {
        throw new Error(e)
    }
}

const remove = async (path) => {
    try {
        let isSuccess = true

        if (await existCheck(path)) {
            await fs.rm(path, {
                recursive: true,
                force: true,
            })
        }
        if (await existCheck(path)) {
            isSuccess = false
        }

        return isSuccess
    } catch (e) {
        throw new Error(e)
    }
}

const copyFile = async (srcPath, distDirectoryPath, distFileName) => {
    try {
        let isSuccess = null
        const distPath = `${distDirectoryPath}/${distFileName}`

        if (!(await existCheck(distDirectoryPath))) {
            throw new Error(`${distDirectoryPath} 폴더가 없습니다.`)
        }

        await fs.copyFile(srcPath, distPath)

        if (await existCheck(distPath)) {
            isSuccess = true
        } else {
            isSuccess = false
        }

        return isSuccess
    } catch (e) {
        throw new Error(e)
    }
}

const installOnlyProd = async () => {
    try {
        let isSuccess = false
        const commands = {
            npm: 'cd ./dist && npm install --only=prod --silent',
            yarn: 'cd ./dist && yarn install --production=true --silent',
        }
        for (const command in commands) {
            const result = await exec(commands[command])
            if (!result.stderr) {
                isSuccess = true
                break
            }
        }
        if (!isSuccess) {
            throw new Error('라이브러리를 설치하지 못했습니다.')
        }
    } catch (e) {
        throw new Error(e)
    }
}

const installAll = async () => {
    let isSuccess = false
    const commands = {
        npm: 'npm install',
        yarn: 'yarn install',
    }
    for (const command in commands) {
        const result = await exec(commands[command])
        if (!result.stderr) {
            isSuccess = true
            break
        }
    }
    if (!isSuccess) {
        throw new Error('라이브러리를 설치하지 못했습니다.')
    }
}

const timer = () => {
    const timer = setInterval(() => {
        process.stdout.write('.')
    }, 100)
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

const install = async () => {
    try {
        // Make dist directory
        const isMade = await loadProcess('makeDirectory', makeDirectory, [
            './dist',
        ])
        if (!isMade) throw new Error('dist 폴더를 생성하지 못했습니다.')

        // Copy package.json to ./dist/package.json
        const isCopiedPackage = await loadProcess('copyFile', copyFile, [
            './package.json',
            './dist',
            'package.json',
        ])
        if (!isCopiedPackage)
            throw new Error('package.json 파일을 복사하지 못했습니다.')

        // Copy package-lock.json to ./dist/package-lock.json
        const isCopiedPackageLock = await loadProcess('copyFile', copyFile, [
            './package-lock.json',
            './dist',
            'package-lock.json',
        ])
        if (!isCopiedPackageLock)
            throw new Error('package.json 파일을 복사하지 못했습니다.')

        // Install production libraries
        await loadProcess('installOnlyProd', installOnlyProd)

        // Remove ./dist/package.json
        await loadProcess('remove package.json', remove, [
            './dist/package.json',
        ])

        // Remove ./dist/package-lock.json
        await loadProcess('remove package-lock.json', remove, [
            './dist/package-lock.json',
        ])

        console.log('Install complete!')
    } catch (e) {
        console.error(e)
    }
}

;(async () => await install())()
