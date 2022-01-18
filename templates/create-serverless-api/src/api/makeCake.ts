
export const handler = async (event: any, context: any) => {
	const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
			message: `i make cake!`
		}),
    }
    
    return response
}
