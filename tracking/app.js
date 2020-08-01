const uuidv4 = require('uuid').v4
const AWS = require('aws-sdk')

const db = new AWS.DynamoDB({apiVersion: '2012-08-10'})

exports.lambdaHandler = async (event, context) => {
    const timestamp = Math.floor(new Date() / 1000).toString()
    const uuid = uuidv4()

    const ip = event['headers']['X-Forwarded-For'].split(', ').pop()
    const countryCode = event['headers']['CloudFront-Viewer-Country']
    const userAgent = event['requestContext']['identity']['userAgent']

    const params = {
        'TableName': process.env['TABLE_NAME'],
        'Item': {
            timestamp: {N: timestamp},
            uuid: {S: uuid},
            user_agent: {S: userAgent},
            ip: {S: ip},
            country_code: {S: countryCode}
        }
    }

    const putItem = async function() {
        return new Promise((resolve, reject) => {
            db.putItem(params, function(err, data) {
                if (err) reject(err)
                else resolve(data)
            })
        })
    }

    let response = {
        'statusCode': 500,
        'headers': { 'Access-Control-Allow-Origin': '*' },
        'body': JSON.stringify({ 'error': 'Unknown error' }, null, 2)
    }

    try {
        const data = await putItem()

        response = {
            'statusCode': 200,
            'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': JSON.stringify(data, null, 2)
        }
    } catch (err) {
        response = {
            'statusCode': 500,
            'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': JSON.stringify(err, null, 2)
        }
    }

    // console.log(response)
    return response
}
