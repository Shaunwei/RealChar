import boto3
import random
import os
from dotenv import load_dotenv

load_dotenv()

client = boto3.client('sns')
topic = 'arn:aws:sns:ap-southeast-1:549164395270:temo-sns'

def publish_to_sns(message_string):
    random_bits = random.getrandbits(128)
    hash = "%032x" % random_bits

    try:
        response = client.publish(
            TopicArn=topic,
            Message=f"{message_string}"
        )
        return response
    
    except Exception as e:
        return e


if __name__ == '__main__':
    publish_to_sns('This is a test message!')