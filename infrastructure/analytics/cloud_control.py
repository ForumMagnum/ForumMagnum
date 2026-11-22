"""Lambda wake/status/watchdog. No database credentials and no stop permission."""

import hmac
import json
import os
import time

import boto3

from control import should_start, watchdog_flags


def state_table():
    return boto3.resource('dynamodb').Table(os.environ['ANALYTICS_CONTROL_TABLE'])


def read_state(table):
    return table.get_item(Key={'id': 'host'}, ConsistentRead=True).get('Item', {})


def publish_status(fields):
    table = state_table()
    names = {f'#f{i}': key for i, key in enumerate(fields)}
    values = {f':v{i}': value for i, value in enumerate(fields.values())}
    expression = ', '.join(f'#f{i} = :v{i}' for i in range(len(fields)))
    table.update_item(Key={'id': 'host'}, UpdateExpression='SET ' + expression,
                      ExpressionAttributeNames=names, ExpressionAttributeValues=values)


def request_wake(table, now, daily=False):
    fields = 'SET desired_until = :until, wake_requested_at = :now'
    if daily:
        fields += ', import_requested_at = :now'
    table.update_item(Key={'id': 'host'}, UpdateExpression=fields,
                      ExpressionAttributeValues={':until': now + 1800, ':now': now})


def reconcile(table, ec2, instance_id, now):
    state = read_state(table)
    instance = ec2.describe_instances(InstanceIds=[instance_id])['Reservations'][0]['Instances'][0]
    phase = instance['State']['Name']
    if should_start(phase, int(state.get('desired_until', 0)), now):
        ec2.start_instances(InstanceIds=[instance_id])
        phase = 'pending'
    ready = phase == 'running' and state.get('phase') == 'ready' and now - int(state.get('heartbeat_at', 0)) < 90
    display_phase = 'ready' if ready else ('stopped' if phase == 'stopped' else 'starting')
    if phase == 'running' and state.get('phase') in ('draining', 'failed'):
        display_phase = state['phase']
    return {'state': display_phase,
            'instance_state': phase,
            'cycle_completed_at': int(state.get('cycle_completed_at', 0)),
            'backup_completed_at': int(state.get('backup_completed_at', 0)),
            'alerts': watchdog_flags(state, now)}


def handler(event, context):
    now = int(time.time())
    # EventBridge invocations have no public HTTP requestContext. Only its
    # resource policy may invoke this function directly; no other principals.
    scheduled = event.get('source') == 'aws.events' and 'requestContext' not in event
    if not scheduled:
        expected = boto3.client('secretsmanager').get_secret_value(
            SecretId=os.environ['ANALYTICS_CONTROL_SECRET_ARN'])['SecretString']
        provided = event.get('headers', {}).get('authorization', '')
        if len(expected) < 32 or not hmac.compare_digest(provided, 'Bearer ' + expected):
            return response(401, {'error': 'Unauthorized'})
    table = state_table()
    method = event.get('requestContext', {}).get('http', {}).get('method', '')
    path = event.get('rawPath', '/')
    if scheduled and event.get('job') == 'daily':
        request_wake(table, now, daily=True)
    elif not scheduled:
        if (method, path) == ('POST', '/wake'):
            request_wake(table, now)
        elif (method, path) != ('GET', '/status'):
            return response(404, {'error': 'Not found'})
    result = reconcile(table, boto3.client('ec2'), os.environ['ANALYTICS_INSTANCE_ID'], now)
    if scheduled:
        cloudwatch = boto3.client('cloudwatch')
        cloudwatch.put_metric_data(Namespace='LWAnalytics', MetricData=[
            {'MetricName': 'Unhealthy', 'Value': int(bool(result['alerts'])), 'Unit': 'Count'},
            {'MetricName': 'RunningMinutes', 'Value': int(result['instance_state'] == 'running'), 'Unit': 'Count'},
        ])
    return response(200 if result['state'] == 'ready' or method == 'GET' else 202, result)


def response(status, body):
    return {'statusCode': status, 'headers': {'content-type': 'application/json', 'cache-control': 'no-store'},
            'body': json.dumps(body)}
