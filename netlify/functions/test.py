def handler(event, context):
    """Simple test function to verify Netlify Functions work"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': '{"status": "test function works", "message": "Netlify Functions are working!"}'
    }

