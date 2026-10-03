terraform {
  required_version = ">= 1.13, < 2.0"
  required_providers {
    aws     = { source = "hashicorp/aws", version = "~> 6.0" }
    archive = { source = "hashicorp/archive", version = "~> 2.7" }
  }
}

provider "aws" { region = "us-east-1" }
data "aws_caller_identity" "current" {}
data "aws_subnet" "host" { id = var.subnet_id }

resource "aws_s3_bucket" "archive" {
  bucket = var.archive_bucket_name
  lifecycle { prevent_destroy = true }
}
resource "aws_s3_bucket" "backups" {
  bucket = var.backup_bucket_name
  lifecycle { prevent_destroy = true }
}
locals { buckets = { archive = aws_s3_bucket.archive.id, backups = aws_s3_bucket.backups.id } }
resource "aws_s3_bucket_versioning" "data" {
  for_each = local.buckets
  bucket   = each.value
  versioning_configuration { status = "Enabled" }
}
resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  for_each = local.buckets
  bucket   = each.value
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}
resource "aws_s3_bucket_public_access_block" "data" {
  for_each                = local.buckets
  bucket                  = each.value
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
resource "aws_s3_bucket_policy" "tls" {
  for_each = local.buckets
  bucket   = each.value
  policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect    = "Deny", Principal = "*", Action = "s3:*",
    Resource  = ["arn:aws:s3:::${each.value}", "arn:aws:s3:::${each.value}/*"],
    Condition = { Bool = { "aws:SecureTransport" = "false" } }
  }] })
}
# Deliberately no expiration on either bucket: base/increment dependencies and
# the canonical archive must never be erased by an unrelated backup lifecycle.

resource "aws_dynamodb_table" "control" {
  name         = "lw-analytics-control"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }
  lifecycle { prevent_destroy = true }
}

resource "aws_security_group" "host" {
  name_prefix = "lw-analytics-"
  description = "Private analytics gateway; ClickHouse itself is loopback only"
  vpc_id      = data.aws_subnet.host.vpc_id
}
resource "aws_vpc_security_group_ingress_rule" "query" {
  security_group_id            = aws_security_group.host.id
  referenced_security_group_id = var.query_client_security_group_id
  ip_protocol                  = "tcp"
  from_port                    = 9443
  to_port                      = 9443
}
resource "aws_vpc_security_group_egress_rule" "https" {
  security_group_id = aws_security_group.host.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}
resource "aws_vpc_security_group_egress_rule" "source" {
  security_group_id            = aws_security_group.host.id
  referenced_security_group_id = var.source_security_group_id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
}
resource "aws_vpc_security_group_ingress_rule" "source" {
  security_group_id            = var.source_security_group_id
  referenced_security_group_id = aws_security_group.host.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
}

resource "aws_iam_role" "host" {
  name_prefix = "lw-analytics-host-"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect = "Allow", Principal = { Service = "ec2.amazonaws.com" }, Action = "sts:AssumeRole"
  }] })
}
resource "aws_iam_instance_profile" "host" { role = aws_iam_role.host.name }
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.host.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}
resource "aws_iam_role_policy" "host" {
  role = aws_iam_role.host.name
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["s3:ListBucket"], Resource = [aws_s3_bucket.archive.arn, aws_s3_bucket.backups.arn] },
    { Effect = "Allow", Action = ["s3:GetObject", "s3:PutObject"], Resource = ["${aws_s3_bucket.archive.arn}/*", "${aws_s3_bucket.backups.arn}/*"] },
    { Effect = "Allow", Action = ["s3:GetObject"], Resource = [var.artifact_object_arn] },
    { Effect = "Allow", Action = ["dynamodb:GetItem", "dynamodb:UpdateItem"], Resource = [aws_dynamodb_table.control.arn] },
    { Effect = "Allow", Action = ["secretsmanager:GetSecretValue"], Resource = [var.worker_secret_arn] }
  ] })
}

resource "aws_ebs_volume" "data" {
  availability_zone = data.aws_subnet.host.availability_zone
  type              = "gp3"
  size              = var.data_gib
  encrypted         = true
  tags              = { Name = "lw-analytics-data" }
  lifecycle { prevent_destroy = true }
}
resource "aws_instance" "host" {
  ami                                  = var.ami_id
  instance_type                        = "r7i.2xlarge"
  subnet_id                            = var.subnet_id
  vpc_security_group_ids               = [aws_security_group.host.id]
  associate_public_ip_address          = false
  iam_instance_profile                 = aws_iam_instance_profile.host.name
  instance_initiated_shutdown_behavior = "stop"
  disable_api_termination              = true
  metadata_options {
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }
  root_block_device {
    volume_size = 32
    volume_type = "gp3"
    encrypted   = true
  }
  user_data = templatefile("${path.module}/bootstrap.sh", {
    volume_id         = aws_ebs_volume.data.id,
    artifact_uri      = var.artifact_uri,
    artifact_sha256   = var.artifact_sha256,
    worker_secret_arn = var.worker_secret_arn,
    archive_bucket    = aws_s3_bucket.archive.id,
    backup_bucket     = aws_s3_bucket.backups.id,
    control_table     = aws_dynamodb_table.control.name
    gateway_hostname  = var.gateway_hostname
  })
  tags = { Name = "lw-analytics", Project = "LWAnalytics" }
  lifecycle {
    precondition {
      condition     = var.rollout_approved && var.network_and_costs_reviewed
      error_message = "Production provisioning requires the reviewed rollout, measured cost comparison, and VPC path approval."
    }
  }
  depends_on = [aws_iam_role_policy.host]
}
resource "aws_volume_attachment" "data" {
  device_name                    = "/dev/sdf"
  volume_id                      = aws_ebs_volume.data.id
  instance_id                    = aws_instance.host.id
  stop_instance_before_detaching = true
}

resource "aws_iam_role" "control" {
  name_prefix = "lw-analytics-control-"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }, Action = "sts:AssumeRole"
  }] })
}
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.control.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
resource "aws_iam_role_policy" "control" {
  role = aws_iam_role.control.name
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["ec2:StartInstances"], Resource = [aws_instance.host.arn] },
    { Effect = "Allow", Action = ["ec2:DescribeInstances"], Resource = ["*"] },
    { Effect = "Allow", Action = ["cloudwatch:PutMetricData"], Resource = ["*"], Condition = { StringEquals = { "cloudwatch:namespace" = "LWAnalytics" } } },
    { Effect = "Allow", Action = ["dynamodb:GetItem", "dynamodb:UpdateItem"], Resource = [aws_dynamodb_table.control.arn] },
    { Effect = "Allow", Action = ["secretsmanager:GetSecretValue"], Resource = [var.control_secret_arn] }
  ] })
}
data "archive_file" "lambda" {
  type        = "zip"
  output_path = "${path.module}/control.zip"
  source {
    content  = file("${path.module}/../cloud_control.py")
    filename = "cloud_control.py"
  }
  source {
    content  = file("${path.module}/../control.py")
    filename = "control.py"
  }
}
resource "aws_lambda_function" "control" {
  function_name                  = "lw-analytics-control"
  role                           = aws_iam_role.control.arn
  runtime                        = "python3.13"
  handler                        = "cloud_control.handler"
  filename                       = data.archive_file.lambda.output_path
  source_code_hash               = data.archive_file.lambda.output_base64sha256
  timeout                        = 30
  reserved_concurrent_executions = 2
  environment {
    variables = {
      ANALYTICS_CONTROL_TABLE      = aws_dynamodb_table.control.name,
      ANALYTICS_CONTROL_SECRET_ARN = var.control_secret_arn,
      ANALYTICS_INSTANCE_ID        = aws_instance.host.id
    }
  }
}
resource "aws_lambda_function_url" "control" {
  function_name      = aws_lambda_function.control.function_name
  authorization_type = "NONE" # Bearer authentication occurs before any wake side effect.
}
resource "aws_lambda_permission" "url" {
  statement_id           = "FunctionURL"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.control.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}
resource "aws_lambda_permission" "url_invoke" {
  statement_id             = "FunctionURLInvoke"
  action                   = "lambda:InvokeFunction"
  function_name            = aws_lambda_function.control.function_name
  principal                = "*"
  invoked_via_function_url = true
}
resource "aws_cloudwatch_event_rule" "schedule" {
  for_each            = { daily = var.daily_schedule, watchdog = "rate(1 minute)" }
  name                = "lw-analytics-${each.key}"
  schedule_expression = each.value
  state               = var.schedules_enabled ? "ENABLED" : "DISABLED"
}
resource "aws_cloudwatch_event_target" "schedule" {
  for_each = aws_cloudwatch_event_rule.schedule
  rule     = each.value.name
  arn      = aws_lambda_function.control.arn
  input    = jsonencode({ source = "aws.events", job = each.key })
}
resource "aws_lambda_permission" "schedule" {
  for_each      = aws_cloudwatch_event_rule.schedule
  statement_id  = each.key
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.control.function_name
  principal     = "events.amazonaws.com"
  source_arn    = each.value.arn
}
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/lw-analytics-control"
  retention_in_days = 14
}
resource "aws_cloudwatch_metric_alarm" "health" {
  alarm_name          = "lw-analytics-health"
  namespace           = "LWAnalytics"
  metric_name         = "Unhealthy"
  statistic           = "Maximum"
  period              = 300
  evaluation_periods  = 2
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "breaching"
  alarm_actions       = [var.alert_topic_arn]
}
resource "aws_cloudwatch_metric_alarm" "runtime" {
  alarm_name          = "lw-analytics-excess-running-hours"
  namespace           = "LWAnalytics"
  metric_name         = "RunningMinutes"
  statistic           = "Sum"
  period              = 86400
  evaluation_periods  = 1
  threshold           = var.daily_runtime_alert_minutes
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = [var.alert_topic_arn] # Never stops active work.
}
resource "aws_cloudwatch_metric_alarm" "source_disk" {
  alarm_name          = "lw-analytics-source-low-storage"
  namespace           = "AWS/RDS"
  metric_name         = "FreeStorageSpace"
  dimensions          = { DBInstanceIdentifier = var.source_rds_identifier }
  statistic           = "Minimum"
  period              = 300
  evaluation_periods  = 2
  threshold           = 100 * 1024 * 1024 * 1024
  comparison_operator = "LessThanThreshold"
  alarm_actions       = [var.alert_topic_arn]
}

output "control_url" { value = aws_lambda_function_url.control.function_url }
output "instance_id" { value = aws_instance.host.id }
output "private_ip" { value = aws_instance.host.private_ip }
