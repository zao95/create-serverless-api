
const uploadLayer = async () => {
	const path = require('path')
	const fs = require('fs/promises')
	const AWS = require('aws-sdk')
	const layerListPath = path.join(__dirname, '../dist/layerList')

	console.info('get stored Layers...')
	const s3 = new AWS.S3()
	const params = {
		Bucket: 'test-bucket'
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
		await s3.deleteObject({ Bucket: 'test-tlqkf2', Key }).promise()
	}

	console.info('save new Layers...')
	for (const libraryName of addLibraryList){
		const file = await fs.readFile(path.join(layerListPath, libraryName))
		await s3.upload({ Bucket: 'test-tlqkf2', Key: libraryName, Body: file }).promise()
	}
}

uploadLayer()
