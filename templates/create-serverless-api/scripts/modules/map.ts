
const getBody = async (req: any) => {
	const buffers = []
	for await (const chunk of req) {
		buffers.push(chunk)
	}

	return Buffer.concat(buffers).toString()
}

// const symbolToObject = (symbol: Symbol) => {
// 	const iterable = ['a', 'b', 'c'];

// 	// 이터레이터
// 	// 이터러블의 Symbol.iterator를 프로퍼티 key로 사용한 메소드는 이터레이터를 반환한다.
// 	const iterator = iterable[Symbol.iterator]();

// 	// 이터레이터는 순회 가능한 자료 구조인 이터러블의 요소를 탐색하기 위한 포인터로서 value, done 프로퍼티를 갖는 객체를 반환하는 next() 함수를 메소드로 갖는 객체이다. 이터레이터의 next() 메소드를 통해 이터러블 객체를 순회할 수 있다.
// 	console.log(iterator.next()); // { value: 'a', done: false }
// 	console.log(iterator.next()); // { value: 'b', done: false }
// 	console.log(iterator.next()); // { value: 'c', done: false }
// 	console.log(iterator.next());
// }

export const mappingEvent = async (req: any) => {
	const [capture, symbolHeaders] = Object.getOwnPropertySymbols(req)
	const headers = req[symbolHeaders]
	const { url: urlWithStage, method } = req
	
	if(!urlWithStage?.startsWith('/development/')){
		throw new Error('404: stage not found')
	}
	const [pathUrlWithStage, queryString]: any = urlWithStage?.split('?')
	const pathUrl = pathUrlWithStage?.replace('/development', '')
	const queries = queryString?.split('&') || []

	let queryStringParameters: any = {}
	let multiValueQueryStringParameters: any = {}
	queries.forEach((query: string) => {
		const [key, value] = query.split('=')
		queryStringParameters[key] = value
		multiValueQueryStringParameters[key] = [value]
	})

	const event = {
		"resource": pathUrl,
		"path": pathUrl,
		"httpMethod": method,
		headers,
		"multiValueHeaders": {
			"accept": [
				"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"
			],
			"accept-encoding": [
				"gzip, deflate, br"
			],
			"accept-language": [
				"en-US,en;q=0.9"
			],
			"cookie": [
				"s_fid=7AABXMPL1AFD9BBF-0643XMPL09956DE2; regStatus=pre-register;"
			],
			"Host": [
				"70ixmpl4fl.execute-api.ca-central-1.amazonaws.com"
			],
			"sec-fetch-dest": [
				"document"
			],
			"sec-fetch-mode": [
				"navigate"
			],
			"sec-fetch-site": [
				"none"
			],
			"upgrade-insecure-requests": [
				"1"
			],
			"User-Agent": [
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36"
			],
			"X-Amzn-Trace-Id": [
				"Root=1-5e66d96f-7491f09xmpl79d18acf3d050"
			],
			"X-Forwarded-For": [
				"52.255.255.12"
			],
			"X-Forwarded-Port": [
				"443"
			],
			"X-Forwarded-Proto": [
				"https"
			]
		},
		queryStringParameters,
		multiValueQueryStringParameters,
		"pathParameters": null,
		"stageVariables": null,
		"requestContext": {
			"resourceId": "2gxmpl",
			"resourcePath": pathUrl,
			"httpMethod": method,
			"extendedRequestId": "JJbxmplHYosFVYQ=",
			"requestTime": "10/Mar/2020:00:03:59 +0000",
			"path": pathUrlWithStage,
			"accountId": "123456789012",
			"protocol": "HTTP/1.1",
			"stage": "development",
			"domainPrefix": "70ixmpl4fl",
			"requestTimeEpoch": 1583798639428,
			"requestId": "77375676-xmpl-4b79-853a-f982474efe18",
			"identity": {
				"cognitoIdentityPoolId": null,
				"accountId": null,
				"cognitoIdentityId": null,
				"caller": null,
				"sourceIp": "52.255.255.12",
				"principalOrgId": null,
				"accessKey": null,
				"cognitoAuthenticationType": null,
				"cognitoAuthenticationProvider": null,
				"userArn": null,
				"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
				"user": null
			},
			"domainName": "70ixmpl4fl.execute-api.us-east-2.amazonaws.com",
			"apiId": "70ixmpl4fl"
		},
		"body": await getBody(req),
		"isBase64Encoded": false
	}
	return event
}

export const context = {
    functionName: '', // The name of the Lambda function.
    functionVersion: '', // The version of the function.
    invokedFunctionArn: '', // The Amazon Resource Name (ARN) that's used to invoke the function. Indicates if the invoker specified a version number or alias.
    memoryLimitInMB: '', // The amount of memory that's allocated for the function.
    awsRequestId: '', // The identifier of the invocation request.
    logGroupName: '', // The log group for the function.
    logStreamName: '', // The log stream for the function instance.
    callbackWaitsForEmptyEventLoop: '', // Set to false to send the response right away when the callback runs, instead of waiting for the Node.js event loop to be empty. If this is false, any outstanding events continue to run during the next invocation.
}