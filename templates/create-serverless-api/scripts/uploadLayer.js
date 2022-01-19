
const SwaggerParser = require("@apidevtools/swagger-parser")

const uploadLayer = async () => {
	const path = require('path')
	const fs = require('fs/promises')
	const AWS = require('aws-sdk')
	const layerListPath = path.join(__dirname, '../dist/layerList')

	const { info } = await SwaggerParser.parse(path.join(__dirname, '../swagger.yaml'))
	const Bucket = info['x-cdk-s3-bucket-name']
	console.log(Bucket)

	console.info('get stored Layers...')
	const s3 = new AWS.S3()
	const params = {
		Bucket
	}

	const objectList = await s3.listObjects(params).promise()
	const contents = objectList?.Contents || []
	
	const s3LibraryTable = {}
	contents.forEach(({ Key }) => { s3LibraryTable[Key] = true })

	console.info('compare new Layers...')
	const unuseLibraryTable = { ...s3LibraryTable }
	const addLibraryList = []
	const localLibraryList = (await fs.readdir(layerListPath))
	localLibraryList.forEach(libraryName => {
		if(unuseLibraryTable[libraryName]){
			delete unuseLibraryTable[libraryName]
		} else {
			addLibraryList.push(libraryName)
		}
	})

	console.info('remove unuse Layers...')
	for (const Key in unuseLibraryTable){
		await s3.deleteObject({ Bucket, Key }).promise()
	}

	console.info('save new Layers...')
	for (const libraryName of addLibraryList){
		const file = await fs.readFile(path.join(layerListPath, libraryName))
		await s3.upload({ Bucket, Key: libraryName, Body: file }).promise()
	}
}

uploadLayer()
