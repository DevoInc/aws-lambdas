###############################################
###############################################
######                                   ######
######    This code is only a example    ######
######                                   ######
###############################################
###############################################
import boto3
import urllib
import zlib
from devo.sender import Sender
from devo.common import Configuration

print("Loading lambda function")
s3 = boto3.client('s3')


def lambda_handler(event, context):
    # Get the object from the event and show its content type
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.unquote_plus(event['Records'][0]['s3']['object']['key']).decode('utf8')
    try:
        print("File to process %s" % key)
        response = s3.get_object(Bucket=bucket, Key=key)
        body = response['Body']
        data = body.read()

        # If the name has a .gz extension, then decompress the data
        if key[-3:] == '.gz':
            data = zlib.decompress(data, 16+zlib.MAX_WBITS)

        config = Configuration("config.json")
        con = Sender(config=config.get("sender"))

        # Send plain text events to Devo
        print("Starting to send lines to Devo")
        counter = 0

        tag = config.get("tag")
        if tag.count(".") == 3:
            tag += ".a.b"

        for line in data.splitlines():
            counter += con.send(tag=tag,
                                msg=line,
                                zip=False)
        con.close()
        print("Finished sending (%d) lines to Devo" % counter)

    ###### END of code containing key variables.

    except Exception as e:
        print(e)
        print("Error getting file '%s' from bucket '%s'. Make sure they \
        exist and your bucket is in the same region as this function." %(key, bucket))
