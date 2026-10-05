"""Pilot-only stop guard; never starts or terminates an instance."""
import os
from datetime import datetime, timezone

import boto3


def handler(event, context):
    ec2 = boto3.client('ec2')
    instance_id = os.environ['INSTANCE_ID']
    instance = ec2.describe_instances(InstanceIds=[instance_id])['Reservations'][0]['Instances'][0]
    now = datetime.now(timezone.utc)
    expired = now >= datetime.fromisoformat(os.environ['DEADLINE'])
    overrun = (now - instance['LaunchTime']).total_seconds() >= float(os.environ.get('MAX_RUNTIME_HOURS', '4')) * 3600
    if instance['State']['Name'] == 'running' and (expired or overrun):
        ec2.stop_instances(InstanceIds=[instance_id])
        return {'stopped': instance_id, 'expired': expired, 'overrun': overrun}
    return {'state': instance['State']['Name']}
