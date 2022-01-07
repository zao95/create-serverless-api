'use strict'

const https = require('https')
const chalk = require('chalk')
const commander = require('commander')
const dns = require('dns')
const execSync = require('child_process').execSync
const fs = require('fs-extra')
const hyperquest = require('hyperquest')
const os = require('os')
const path = require('path')
const semver = require('semver')
const spawn = require('cross-spawn')
const tmp = require('tmp')
const unpack = require('tar-pack').unpack
const url = require('url')
const validateProjectName = require('validate-npm-package-name')

const rootPackageJson = require('../package.json')
const templatePackageJson = require('../templates/create-serverless-api/package.json')

function isUsingYarn() {
    return (process.env.npm_config_user_agent || '').indexOf('yarn') === 0
}

let projectName

function init() {
    const program = new commander.Command(rootPackageJson.name)
        .version(rootPackageJson.version)
        .arguments('<project-directory>')
        .usage(`${chalk.green('<project-directory>')} [options]`)
        .action((name) => {
            projectName = name
        })
        .allowUnknownOption()
        .on('--help', () => {
            console.log(
                `    Only ${chalk.green('<project-directory>')} is required.`
            )
            console.log()
            console.log(
                `    If you have any problems, please register the issue:`
            )
            console.log(
                `      ${chalk.cyan(
                    'https://github.com/zao95/create-serverless-api/issues/new'
                )}`
            )
            console.log()
        })
        .parse(process.argv)

    if (typeof projectName === 'undefined') {
        console.error('Please specify the project directory:')
        console.log(
            `  ${chalk.cyan(program.name())} ${chalk.green(
                '<project-directory>'
            )}`
        )
        console.log()
        console.log('For example:')
        console.log(
            `  ${chalk.cyan(program.name())} ${chalk.green(
                'my-serverless-api'
            )}`
        )
        process.exit(1)
    }

    checkForLatestVersion()
        .catch(() => {
            try {
                return execSync('npm view create-serverless-api version')
                    .toString()
                    .trim()
            } catch (e) {
                return null
            }
        })
        .then((latest) => {
            if (latest && semver.lt(rootPackageJson.version, latest)) {
                console.log()
                console.error(
                    chalk.yellow(
                        `You are running \`create-serverless-api\` ${rootPackageJson.version}, which is behind the latest release (${latest}).\n\n` +
                            'We no longer support global installation of Create Serverless API.'
                    )
                )
                console.log()
                console.log(
                    'Please remove any global installs with one of the following commands:\n' +
                        '- npm uninstall -g create-serverless-api\n' +
                        '- yarn global remove create-serverless-api'
                )
                console.log()
                process.exit(1)
            } else {
                const useYarn = isUsingYarn()
                createApp(projectName, useYarn)
            }
        })
}

function createApp(name, useYarn) {
    const unsupportedNodeVersion = !semver.satisfies(
        semver.coerce(process.version),
        '>=14'
    )

    if (unsupportedNodeVersion) {
        console.log(
            chalk.yellow(
                `You are using Node ${process.version}.\n\n` +
                    `Please update to Node 14 or higher.\n`
            )
        )
        process.exit(1)
    }

    /**
     * 입력한 "경로/이름"을 기반으로 파악한 절대경로
     */
    const root = path.resolve(name)
    /**
     * 입력한 "경로/이름"을 기반으로 파악한 이름
     */
    const apiName = path.basename(root)

    /**
     * npm pacakge name validation
     */
    checkApiName(apiName)
    /**
     * 경로를 체크해서, 없으면 폴더를 만든다.
     */
    fs.ensureDirSync(name)
    /**
     * 설정한 경로 내부에 앞으로 저장될 파일이 있는 지 체크
     */
    if (!isSafeToCreateProjectIn(root, name)) {
        process.exit(1)
    }
    console.log()

    console.log(`Creating a new Serverless API in ${chalk.green(root)}.`)
    console.log()

    /**
     * Major version: 0
     * Minor version: 1
     * Patch version: 0
     */
    /**
     * Package.json 생성
     */
    const packageJson = { name: apiName }
    fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify({ ...packageJson, ...templatePackageJson }, null, 2) +
            os.EOL
    )

    process.chdir(root)
    if (!useYarn && !checkThatNpmCanReadCwd()) {
        process.exit(1)
    }

    if (!useYarn) {
        const npmInfo = checkNpmVersion()
        if (!npmInfo.hasMinNpm) {
            if (npmInfo.npmVersion) {
                console.log(
                    chalk.yellow(
                        `You are using npm ${process.version}.\n\n` +
                            `Please update to npm 6 or higher.\n`
                    )
                )
                process.exit(1)
            }
        }
    }

    run(root, apiName, useYarn)
}

function install(root, useYarn, dependencies, isOnline) {
    return new Promise((resolve, reject) => {
        let command
        let args
        if (useYarn) {
            command = 'yarnpkg'
            args = ['add', '--exact']
            if (!isOnline) {
                args.push('--offline')
            }
            ;[].push.apply(args, dependencies)

            args.push('--cwd')
            args.push(root)

            if (!isOnline) {
                console.log(chalk.yellow('You appear to be offline.'))
                console.log(
                    chalk.yellow('Falling back to the local Yarn cache.')
                )
                console.log()
            }
        } else {
            command = 'npm'
            args = [
                'install',
                '--no-audit',
                '--save',
                '--save-exact',
                '--loglevel',
                'error',
            ].concat(dependencies)
        }

        const child = spawn(command, args, { stdio: 'inherit' })
        child.on('close', (code) => {
            if (code !== 0) {
                reject({
                    command: checkNodeVersion`${command} ${args.join(' ')}`,
                })
                return
            }
            resolve()
        })
    })
}

function run(root, apiName, useYarn) {
    const templateToInstall = 'create-serverless-api'
    const allDependencies = Object.keys(templatePackageJson.devDependencies)

    console.log('Installing packages. This might take a couple of minutes.')

    Promise.resolve(getPackageInfo(templateToInstall))
        .then((templateInfo) => {
            console.log('templateToInstall', templateToInstall)
            return checkIfOnline(useYarn).then((isOnline) => ({
                isOnline,
                templateInfo,
            }))
        })
        .then(({ isOnline, templateInfo }) => {
            console.log()
            console.log(
                `Installing\n${chalk.cyan(
                    Object.keys(templatePackageJson.devDependencies).join(', ')
                )}...`
            )
            console.log()

            return install(root, useYarn, allDependencies, isOnline).then(
                () => ({
                    templateInfo,
                })
            )
        })
        .then(async ({ templateInfo }) => {
            const templateName = templateInfo.name

            // await executeNodeScript(
            //     {
            //         cwd: process.cwd(),
            //         args: nodeArgs,
            //     },
            //     [root, apiName, originalDirectory, templateName],
            //     `
            //         const init = require('${packageName}/scripts/init.js');
            //         init.apply(null, JSON.parse(process.argv[1]));
            //     `
            // )
        })
        .catch((reason) => {
            console.log()
            console.log('Aborting installation.')
            if (reason.command) {
                console.log(`  ${chalk.cyan(reason.command)} has failed.`)
            } else {
                console.log(
                    chalk.red('Unexpected error. Please report it as a bug:')
                )
                console.log(reason)
            }
            console.log()

            const knownGeneratedFiles = ['package.json', 'node_modules']
            const currentFiles = fs.readdirSync(path.join(root))
            currentFiles.forEach((file) => {
                knownGeneratedFiles.forEach((fileToMatch) => {
                    if (file === fileToMatch) {
                        console.log(
                            `Deleting generated file... ${chalk.cyan(file)}`
                        )
                        fs.removeSync(path.join(root, file))
                    }
                })
            })
            const remainingFiles = fs.readdirSync(path.join(root))
            if (!remainingFiles.length) {
                console.log(
                    `Deleting ${chalk.cyan(`${apiName}/`)} from ${chalk.cyan(
                        path.resolve(root, '..')
                    )}`
                )
                process.chdir(path.resolve(root, '..'))
                fs.removeSync(path.join(root))
            }
            console.log('Done.')
            process.exit(1)
        })
}

function getTemporaryDirectory() {
    return new Promise((resolve, reject) => {
        tmp.dir({ unsafeCleanup: true }, (err, tmpdir, callback) => {
            if (err) {
                reject(err)
            } else {
                resolve({
                    tmpdir: tmpdir,
                    cleanup: () => {
                        try {
                            callback()
                        } catch (ignored) {}
                    },
                })
            }
        })
    })
}

function extractStream(stream, dest) {
    return new Promise((resolve, reject) => {
        stream.pipe(
            unpack(dest, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(dest)
                }
            })
        )
    })
}

function getPackageInfo(installPackage) {
    if (installPackage.match(/^.+\.(tgz|tar\.gz)$/)) {
        return getTemporaryDirectory()
            .then((obj) => {
                let stream
                if (/^http/.test(installPackage)) {
                    stream = hyperquest(installPackage)
                } else {
                    stream = fs.createReadStream(installPackage)
                }
                return extractStream(stream, obj.tmpdir).then(() => obj)
            })
            .then((obj) => {
                const { name, version } = require(path.join(
                    obj.tmpdir,
                    'package.json'
                ))
                obj.cleanup()
                return { name, version }
            })
            .catch((err) => {
                console.log(
                    `Could not extract the package name from the archive: ${err.message}`
                )
                const assumedProjectName = installPackage.match(
                    /^.+\/(.+?)(?:-\d+.+)?\.(tgz|tar\.gz)$/
                )[1]
                console.log(
                    `Based on the filename, assuming it is "${chalk.cyan(
                        assumedProjectName
                    )}"`
                )
                return Promise.resolve({ name: assumedProjectName })
            })
    } else if (installPackage.startsWith('git+')) {
        return Promise.resolve({
            name: installPackage.match(/([^/]+)\.git(#.*)?$/)[1],
        })
    } else if (installPackage.match(/.+@/)) {
        return Promise.resolve({
            name:
                installPackage.charAt(0) +
                installPackage.substr(1).split('@')[0],
            version: installPackage.split('@')[1],
        })
    } else if (installPackage.match(/^file:/)) {
        const installPackagePath = installPackage.match(/^file:(.*)?$/)[1]
        const { name, version } = require(path.join(
            installPackagePath,
            'package.json'
        ))
        return Promise.resolve({ name, version })
    }
    return Promise.resolve({ name: installPackage })
}

function checkNpmVersion() {
    let hasMinNpm = false
    let npmVersion = null
    try {
        npmVersion = execSync('npm --version').toString().trim()
        hasMinNpm = semver.gte(npmVersion, '6.0.0')
    } catch (err) {}
    return {
        hasMinNpm: hasMinNpm,
        npmVersion: npmVersion,
    }
}

function checkYarnVersion() {
    const minYarnPnp = '1.12.0'
    const maxYarnPnp = '2.0.0'
    let hasMinYarnPnp = false
    let hasMaxYarnPnp = false
    let yarnVersion = null
    try {
        yarnVersion = execSync('yarnpkg --version').toString().trim()
        if (semver.valid(yarnVersion)) {
            hasMinYarnPnp = semver.gte(yarnVersion, minYarnPnp)
            hasMaxYarnPnp = semver.lt(yarnVersion, maxYarnPnp)
        } else {
            const trimmedYarnVersionMatch = /^(.+?)[-+].+$/.exec(yarnVersion)
            if (trimmedYarnVersionMatch) {
                const trimmedYarnVersion = trimmedYarnVersionMatch.pop()
                hasMinYarnPnp = semver.gte(trimmedYarnVersion, minYarnPnp)
                hasMaxYarnPnp = semver.lt(trimmedYarnVersion, maxYarnPnp)
            }
        }
    } catch (err) {
        // ignore
    }
    return {
        hasMinYarnPnp: hasMinYarnPnp,
        hasMaxYarnPnp: hasMaxYarnPnp,
        yarnVersion: yarnVersion,
    }
}

function checkNodeVersion(packageName) {
    const packageJsonPath = path.resolve(
        process.cwd(),
        'node_modules',
        packageName,
        'package.json'
    )

    if (!fs.existsSync(packageJsonPath)) {
        return
    }

    const packageJson = require(packageJsonPath)
    if (!packageJson.engines || !packageJson.engines.node) {
        return
    }

    if (!semver.satisfies(process.version, packageJson.engines.node)) {
        console.error(
            chalk.red(
                'You are running Node %s.\n' +
                    'Create Serverless API requires Node %s or higher. \n' +
                    'Please update your version of Node.'
            ),
            process.version,
            packageJson.engines.node
        )
        process.exit(1)
    }
}

function checkApiName(apiName) {
    /**
     * npm pacakge name validation
     */
    const validationResult = validateProjectName(apiName)
    /**
     * npm의 새로운 이름 기준을 통과하는 지 여부
     */
    if (!validationResult.validForNewPackages) {
        console.error(
            chalk.red(
                `Cannot create a project named ${chalk.green(
                    `"${apiName}"`
                )} because of npm naming restrictions:\n`
            )
        )
        ;[
            ...(validationResult.errors || []),
            ...(validationResult.warnings || []),
        ].forEach((error) => {
            console.error(chalk.red(`  * ${error}`))
        })
        console.error(chalk.red('\nPlease choose a different project name.'))
        process.exit(1)
    }

    const dependencies = ['react', 'react-dom', 'react-scripts'].sort()
    /**
     * dependencies와 같은 이름을 가졌는 지 체크
     */
    if (dependencies.includes(apiName)) {
        console.error(
            chalk.red(
                `Cannot create a project named ${chalk.green(
                    `"${apiName}"`
                )} because a dependency with the same name exists.\n` +
                    `Due to the way npm works, the following names are not allowed:\n\n`
            ) +
                chalk.cyan(
                    dependencies.map((depName) => `  ${depName}`).join('\n')
                ) +
                chalk.red('\n\nPlease choose a different project name.')
        )
        process.exit(1)
    }
}

function makeCaretRange(dependencies, name) {
    const version = dependencies[name]

    if (typeof version === 'undefined') {
        console.error(chalk.red(`Missing ${name} dependency in package.json`))
        process.exit(1)
    }

    let patchedVersion = `^${version}`

    if (!semver.validRange(patchedVersion)) {
        console.error(
            `Unable to patch ${name} dependency version because version ${chalk.red(
                version
            )} will become invalid ${chalk.red(patchedVersion)}`
        )
        patchedVersion = version
    }

    dependencies[name] = patchedVersion
}

function setCaretRangeForRuntimeDeps(packageName) {
    const packagePath = path.join(process.cwd(), 'package.json')
    const packageJson = require(packagePath)

    if (typeof packageJson.dependencies === 'undefined') {
        console.error(chalk.red('Missing dependencies in package.json'))
        process.exit(1)
    }

    const packageVersion = packageJson.dependencies[packageName]
    if (typeof packageVersion === 'undefined') {
        console.error(
            chalk.red(`Unable to find ${packageName} in package.json`)
        )
        process.exit(1)
    }

    makeCaretRange(packageJson.dependencies, 'react')
    makeCaretRange(packageJson.dependencies, 'react-dom')

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + os.EOL)
}

function isSafeToCreateProjectIn(root, name) {
    const validFiles = [
        '.babelrc',
        '.eslintrc.json',
        '.gitignore',
        'cdk.json',
        'install.js',
        'LICENSE',
        'package.json',
        'swagger.yaml',
        'tsconfig.json',
    ]
    const errorLogFilePatterns = [
        'npm-debug.log',
        'yarn-error.log',
        'yarn-debug.log',
    ]
    const isErrorLog = (file) => {
        return errorLogFilePatterns.some((pattern) => file.startsWith(pattern))
    }

    const conflicts = fs
        .readdirSync(root)
        .filter((file) => !validFiles.includes(file))
        .filter((file) => !/\.iml$/.test(file))
        .filter((file) => !isErrorLog(file))

    if (conflicts.length > 0) {
        console.log(
            `The directory ${chalk.green(
                name
            )} contains files that could conflict:`
        )
        console.log()
        for (const file of conflicts) {
            try {
                const stats = fs.lstatSync(path.join(root, file))
                if (stats.isDirectory()) {
                    console.log(`  ${chalk.blue(`${file}/`)}`)
                } else {
                    console.log(`  ${file}`)
                }
            } catch (e) {
                console.log(`  ${file}`)
            }
        }
        console.log()
        console.log(
            'Either try using a new directory name, or remove the files listed above.'
        )

        return false
    }

    fs.readdirSync(root).forEach((file) => {
        if (isErrorLog(file)) {
            fs.removeSync(path.join(root, file))
        }
    })
    return true
}

function getProxy() {
    if (process.env.https_proxy) {
        return process.env.https_proxy
    } else {
        try {
            let httpsProxy = execSync('npm config get https-proxy')
                .toString()
                .trim()
            return httpsProxy !== 'null' ? httpsProxy : undefined
        } catch (e) {
            return
        }
    }
}

function checkThatNpmCanReadCwd() {
    const cwd = process.cwd()
    let childOutput = null
    try {
        childOutput = spawn.sync('npm', ['config', 'list']).output.join('')
    } catch (err) {
        return true
    }
    if (typeof childOutput !== 'string') {
        return true
    }
    const lines = childOutput.split('\n')
    const prefix = '; cwd = '
    const line = lines.find((line) => line.startsWith(prefix))
    if (typeof line !== 'string') {
        return true
    }
    const npmCWD = line.substring(prefix.length)
    if (npmCWD === cwd) {
        return true
    }
    console.error(
        chalk.red(
            `Could not start an npm process in the right directory.\n\n` +
                `The current directory is: ${chalk.bold(cwd)}\n` +
                `However, a newly started npm process runs in: ${chalk.bold(
                    npmCWD
                )}\n\n` +
                `This is probably caused by a misconfigured system terminal shell.`
        )
    )
    if (process.platform === 'win32') {
        console.error(
            chalk.red(`On Windows, this can usually be fixed by running:\n\n`) +
                `  ${chalk.cyan(
                    'reg'
                )} delete "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n` +
                `  ${chalk.cyan(
                    'reg'
                )} delete "HKLM\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n\n` +
                chalk.red(`Try to run the above two lines in the terminal.\n`) +
                chalk.red(
                    `To learn more about this problem, read: https://blogs.msdn.microsoft.com/oldnewthing/20071121-00/?p=24433/`
                )
        )
    }
    return false
}

function checkIfOnline(useYarn) {
    if (!useYarn) {
        return Promise.resolve(true)
    }

    return new Promise((resolve) => {
        dns.lookup('registry.yarnpkg.com', (err) => {
            let proxy
            if (err != null && (proxy = getProxy())) {
                dns.lookup(url.parse(proxy).hostname, (proxyErr) => {
                    resolve(proxyErr == null)
                })
            } else {
                resolve(err == null)
            }
        })
    })
}

function checkForLatestVersion() {
    return new Promise((resolve, reject) => {
        https
            .get(
                'https://registry.npmjs.org/-/package/create-serverless-api/dist-tags',
                (res) => {
                    if (res.statusCode === 200) {
                        let body = ''
                        res.on('data', (data) => (body += data))
                        res.on('end', () => {
                            resolve(JSON.parse(body).latest)
                        })
                    } else {
                        reject()
                    }
                }
            )
            .on('error', () => {
                reject()
            })
    })
}

module.exports = {
    init,
}
