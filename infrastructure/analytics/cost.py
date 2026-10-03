"""Transparent scenario calculator; null/unmeasured inputs never become zero."""

import argparse
import json


def estimate(inputs):
    required = ('days_per_month', 'running_hours_per_day', 'ec2_hourly', 'gp3_gib', 'root_gib',
                'gp3_gib_monthly', 'archive_gb', 'backup_gb', 's3_gb_monthly',
                'requests_monthly', 'monitoring_monthly', 'network_monthly', 'queue_monthly',
                'managed_compute_units', 'managed_unit_hourly', 'managed_storage_tb',
                'managed_tb_monthly', 'managed_importer_monthly', 'managed_backup_monthly',
                'initial_clone', 'initial_compute', 'initial_transfer', 'initial_overlap_storage')
    missing = [key for key in required if inputs.get(key) is None]
    if missing:
        return {'established': False, 'missing': missing}
    if any(not isinstance(inputs[key], (int, float)) or inputs[key] < 0 for key in required):
        raise ValueError('Cost inputs must be nonnegative numbers')
    hours = inputs['days_per_month'] * inputs['running_hours_per_day']
    shared = inputs['archive_gb'] * inputs['s3_gb_monthly'] + inputs['requests_monthly'] + inputs['queue_monthly']
    self_hosted = shared + hours * inputs['ec2_hourly'] + (
        inputs['gp3_gib'] + inputs['root_gib']) * inputs['gp3_gib_monthly'] + (
        inputs['backup_gb'] * inputs['s3_gb_monthly']) + inputs['monitoring_monthly'] + inputs['network_monthly']
    managed = shared + hours * inputs['managed_compute_units'] * inputs['managed_unit_hourly'] + (
        inputs['managed_storage_tb'] * inputs['managed_tb_monthly']) + (
        inputs['managed_importer_monthly'] + inputs['managed_backup_monthly'])
    initial = sum(inputs[key] for key in ('initial_clone', 'initial_compute', 'initial_transfer', 'initial_overlap_storage'))
    return {'established': inputs.get('measured', False), 'self_hosted_monthly': round(self_hosted, 2),
            'managed_monthly': round(managed, 2), 'self_hosted_minus_managed': round(self_hosted - managed, 2),
            'initial_load': round(initial, 2), 'requires_cost_decision': self_hosted > managed}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('inputs')
    args = parser.parse_args()
    with open(args.inputs) as file:
        print(json.dumps(estimate(json.load(file)), indent=2))
