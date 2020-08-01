const uuidv4 = require('uuid').v4
const parser = require('ua-parser-js')
const AWS = require('aws-sdk')

const db = new AWS.DynamoDB({apiVersion: '2012-08-10'})

const makeString = s => {
    if (s && typeof s == 'string') {
        return { S: s }
    }

    return { NULL: true }
}

exports.lambdaHandler = async (event, context) => {
    const timestamp = Math.floor(new Date() / 1000).toString()
    const uuid = uuidv4()

    const ip = event['headers']['X-Forwarded-For'].split(', ').pop()
    const countryCode = event['headers']['CloudFront-Viewer-Country']
    const userAgent = parser(event['requestContext']['identity']['userAgent'])

    const params = {
        'TableName': process.env['TABLE_NAME'],
        'Item': {
            timestamp: {N: timestamp},
            uuid: {S: uuid},
            
            country_code: {S: countryCode},
            browser: {M: {
                name: makeString(userAgent.browser.name),
                version: makeString(userAgent.browser.version)
            }},
            cpu: makeString(userAgent.cpu.architecture),
            device: {M: {
                type: makeString(userAgent.device.type),
                vendor: makeString(userAgent.device.vendor),
                model: makeString(userAgent.device.model)
            }},
            engine: {M: {
                name: makeString(userAgent.engine.name),
                version: makeString(userAgent.engine.version)
            }},
            os: {M: {
                name: makeString(userAgent.os.name),
                version: makeString(userAgent.os.version)
            }},

            ip: {S: ip},
            user_agent: {S: userAgent.ua},
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
