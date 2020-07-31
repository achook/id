const uuidv4 = require('uuid').v4
const AWS = require('aws-sdk')

const db = new AWS.DynamoDB({apiVersion: '2012-08-10'})

exports.lambdaHandler = async (event, context) => {
    const ip = event['requestContext']['identity']['sourceIp']
    const countryCode = event['headers']['CloudFront-Viewer-Country']
    const uuid = uuidv4()
    const userAgent = event['requestContext']['identity']['userAgent']
    const timestamp = Math.floor(new Date() / 1000).toString()

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
        'body': JSON.stringify({
            'error': 'Unknown error'
        })
    }

    try {
        const data = await putItem()

        response = {
            'statusCode': 200,
            'body': JSON.stringify(data)
        }
    } catch (err) {
        response = {
            'statusCode': 500,
            'body': JSON.stringify(err)
        }
    }

    console.log(response)
    return response
}
