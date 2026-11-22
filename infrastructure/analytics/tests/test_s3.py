import io

import boto3
import pytest
from botocore.response import StreamingBody
from botocore.stub import Stubber

from archive import digest, inventory, put_immutable


def client():
    return boto3.client('s3', region_name='us-east-1', aws_access_key_id='fixture',
                        aws_secret_access_key='fixture')


def test_s3_repeated_publication_checks_existing_bytes():
    s3 = client()
    body = b'archive fixture'
    key = 'archive/v1/objects/fixture.ndjson.gz'
    with Stubber(s3) as stub:
        stub.add_client_error('put_object', service_error_code='PreconditionFailed', http_status_code=412,
                              expected_params={'Bucket': 'fixture', 'Key': key, 'Body': body,
                                               'IfNoneMatch': '*', 'ServerSideEncryption': 'AES256',
                                               'Metadata': {'sha256': digest(body)}})
        stub.add_response('get_object', {'Body': StreamingBody(io.BytesIO(body), len(body))},
                           {'Bucket': 'fixture', 'Key': key})
        put_immutable({'client': s3, 'bucket': 'fixture'}, key, body)
        stub.assert_no_pending_responses()


def test_s3_conflicting_object_is_not_overwritten():
    s3 = client()
    with Stubber(s3) as stub:
        stub.add_client_error('put_object', service_error_code='PreconditionFailed', http_status_code=412)
        stub.add_response('get_object', {'Body': StreamingBody(io.BytesIO(b'old'), 3)})
        with pytest.raises(ValueError, match='Immutable object conflict'):
            put_immutable({'client': s3, 'bucket': 'fixture'}, 'archive/fixture', b'new')


def test_s3_inventory_follows_every_page():
    s3 = client()
    with Stubber(s3) as stub:
        stub.add_response('list_objects_v2', {'IsTruncated': True, 'NextContinuationToken': 'next',
                          'Contents': [{'Key': 'archive/v1/manifests/z.json'}]},
                          {'Bucket': 'fixture', 'Prefix': 'archive/v1/manifests/'})
        stub.add_response('list_objects_v2', {'IsTruncated': False,
                          'Contents': [{'Key': 'archive/v1/manifests/zz.json'}]},
                          {'Bucket': 'fixture', 'Prefix': 'archive/v1/manifests/', 'ContinuationToken': 'next'})
        assert list(inventory({'client': s3, 'bucket': 'fixture'})) == [
            'archive/v1/manifests/z.json', 'archive/v1/manifests/zz.json']
        stub.assert_no_pending_responses()
