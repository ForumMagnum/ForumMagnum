import json

from deploy.run_cli import read_environment


def test_operator_preserves_literal_shell_metacharacters(tmp_path):
    password = 'quotes" apostrophe\' dollar$VALUE command$(false) backtick`false` slash\\ unicodeé'
    path = tmp_path / 'worker.env'
    path.write_text('ANALYTICS_CH_INGEST_PASSWORD=' + json.dumps(password) + '\nAWS_DEFAULT_REGION=us-east-1\n')
    assert read_environment(path) == {'ANALYTICS_CH_INGEST_PASSWORD': password, 'AWS_DEFAULT_REGION': 'us-east-1'}
