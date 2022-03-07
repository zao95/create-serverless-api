const fs = require('fs/promises')

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

const destroy = async () => {
    try {
        // Remove data file
        const removeData = await loadProcess('remove', remove, [
            './infra/projectData.json',
        ])
        if (!removeData) throw new Error('data 파일을 제거하지 못했습니다.')

        console.log('Destroy complete!')
    } catch (e) {
        console.error(e)
    }
}

;(async () => await destroy())()
