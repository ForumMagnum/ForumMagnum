terraform {
  required_version = ">= 1.13, < 2.0"
  required_providers {
    aws     = { source = "hashicorp/aws", version = "~> 6.0" }
    archive = { source = "hashicorp/archive", version = "~> 2.7" }
  }
}
provider "aws" {
  region              = "us-east-1"
  allowed_account_ids = ["083919364732"]
  default_tags { tags = { Project = "LWAnalyticsPilot", Owner = "RubyBloom", Purpose = "Read-only evaluation", ReviewBy = "2026-10-08" } }
}
locals {
  name   = "lw-analytics-pilot-20261001"
  bucket = "lw-analytics-pilot-083919364732-20261001"
}
resource "aws_s3_bucket" "pilot" {
  bucket = local.bucket
  lifecycle { prevent_destroy = true }
}
resource "aws_s3_bucket_versioning" "pilot" {
  bucket = aws_s3_bucket.pilot.id
  versioning_configuration { status = "Enabled" }
}
resource "aws_s3_bucket_server_side_encryption_configuration" "pilot" {
  bucket = aws_s3_bucket.pilot.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}
resource "aws_s3_bucket_public_access_block" "pilot" {
  bucket                  = aws_s3_bucket.pilot.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
resource "aws_s3_bucket_policy" "tls" {
  bucket = aws_s3_bucket.pilot.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Deny", Principal = "*", Action = "s3:*", Resource = [aws_s3_bucket.pilot.arn, "${aws_s3_bucket.pilot.arn}/*"], Condition = { Bool = { "aws:SecureTransport" = "false" } } }] })
}
resource "aws_s3_object" "artifact" {
  bucket      = aws_s3_bucket.pilot.id
  key         = "artifacts/${filesha256("${path.module}/artifact.tar.gz")}.tar.gz"
  source      = "${path.module}/artifact.tar.gz"
  source_hash = filesha256("${path.module}/artifact.tar.gz")
}
resource "aws_security_group" "host" {
  name        = local.name
  description = "Pilot: no ingress; administration through SSM"
  vpc_id      = "vpc-339c9b48"
}
resource "aws_vpc_security_group_egress_rule" "https" {
  security_group_id = aws_security_group.host.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}
resource "aws_iam_role" "host" {
  name               = local.name
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Principal = { Service = "ec2.amazonaws.com" }, Action = "sts:AssumeRole" }] })
}
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.host.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}
resource "aws_iam_role_policy" "data" {
  role = aws_iam_role.host.name
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["s3:ListBucket"], Resource = [aws_s3_bucket.pilot.arn] },
    { Effect = "Allow", Action = ["s3:GetObject"], Resource = ["${aws_s3_bucket.pilot.arn}/*"] },
    { Effect = "Allow", Action = ["s3:PutObject"], Resource = ["${aws_s3_bucket.pilot.arn}/archive/*", "${aws_s3_bucket.pilot.arn}/backups/*", "${aws_s3_bucket.pilot.arn}/clickhouse/*", "${aws_s3_bucket.pilot.arn}/evidence/*", "${aws_s3_bucket.pilot.arn}/coverage/*"] }
  ] })
}
resource "aws_iam_instance_profile" "host" {
  name = local.name
  role = aws_iam_role.host.name
}
resource "aws_ebs_volume" "data" {
  availability_zone = "us-east-1f"
  type              = "gp3"
  size              = var.data_gib
  encrypted         = true
  tags              = { Name = "${local.name}-data" }
  lifecycle { prevent_destroy = true }
}
resource "aws_instance" "host" {
  ami                                  = "ami-0045d7fc2ad003464"
  instance_type                        = "r7i.2xlarge"
  subnet_id                            = "subnet-a30b9dac"
  associate_public_ip_address          = true
  vpc_security_group_ids               = [aws_security_group.host.id]
  iam_instance_profile                 = aws_iam_instance_profile.host.name
  instance_initiated_shutdown_behavior = "stop"
  metadata_options { http_tokens = "required" }
  root_block_device {
    volume_type = "gp3"
    volume_size = 32
    encrypted   = true
  }
  user_data = templatefile("${path.module}/bootstrap.sh", {
    volume_id       = aws_ebs_volume.data.id,
    bucket          = aws_s3_bucket.pilot.id,
    artifact_key    = aws_s3_object.artifact.key,
    artifact_sha256 = aws_s3_object.artifact.source_hash
  })
  tags       = { Name = local.name }
  depends_on = [aws_iam_role_policy.data, aws_iam_role_policy_attachment.ssm, aws_vpc_security_group_egress_rule.https]
}
resource "aws_volume_attachment" "data" {
  device_name                    = "/dev/sdf"
  volume_id                      = aws_ebs_volume.data.id
  instance_id                    = aws_instance.host.id
  stop_instance_before_detaching = true
}
resource "aws_iam_role" "guard" {
  name               = "${local.name}-guard"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }, Action = "sts:AssumeRole" }] })
}
resource "aws_iam_role_policy" "guard" {
  role = aws_iam_role.guard.name
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["ec2:DescribeInstances"], Resource = ["*"] },
    { Effect = "Allow", Action = ["ec2:StopInstances"], Resource = [aws_instance.host.arn] },
    { Effect = "Allow", Action = ["logs:CreateLogStream", "logs:PutLogEvents"], Resource = ["${aws_cloudwatch_log_group.guard.arn}:*"] }
  ] })
}
resource "aws_cloudwatch_log_group" "guard" {
  name              = "/aws/lambda/${local.name}-guard"
  retention_in_days = 7
}
data "archive_file" "guard" {
  type        = "zip"
  source_file = "${path.module}/guard.py"
  output_path = "${path.module}/guard.zip"
}
resource "aws_lambda_function" "guard" {
  function_name    = "${local.name}-guard"
  role             = aws_iam_role.guard.arn
  runtime          = "python3.13"
  handler          = "guard.handler"
  filename         = data.archive_file.guard.output_path
  source_code_hash = data.archive_file.guard.output_base64sha256
  timeout          = 30
  environment { variables = { INSTANCE_ID = aws_instance.host.id, DEADLINE = "2026-10-09T00:00:00+00:00", MAX_RUNTIME_HOURS = tostring(var.max_runtime_hours) } }
  depends_on = [aws_iam_role_policy.guard]
}
resource "aws_cloudwatch_event_rule" "guard" {
  name                = "${local.name}-guard"
  schedule_expression = "rate(15 minutes)"
}
resource "aws_cloudwatch_event_target" "guard" {
  rule = aws_cloudwatch_event_rule.guard.name
  arn  = aws_lambda_function.guard.arn
}
resource "aws_lambda_permission" "guard" {
  statement_id  = "AllowScheduledGuard"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.guard.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.guard.arn
}
output "instance_id" { value = aws_instance.host.id }
output "data_volume_id" { value = aws_ebs_volume.data.id }
output "bucket" { value = aws_s3_bucket.pilot.id }
output "security_group_id" { value = aws_security_group.host.id }

# Only the named analytics RDS security group is reachable, with no new host ingress.
resource "aws_vpc_security_group_egress_rule" "backfill_source" {
  count                        = var.backfill_enabled ? 1 : 0
  security_group_id            = aws_security_group.host.id
  referenced_security_group_id = "sg-0a0e6d57dc01035c0"
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  description                  = "Read-only analytics backfill to existing RDS"
}
resource "aws_vpc_security_group_ingress_rule" "backfill_source" {
  count                        = var.backfill_enabled ? 1 : 0
  security_group_id            = "sg-0a0e6d57dc01035c0"
  referenced_security_group_id = aws_security_group.host.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  description                  = "Analytics backfill host only"
}
resource "aws_iam_role_policy" "backfill_source" {
  count = var.backfill_enabled ? 1 : 0
  name  = "ReadOnlyBackfillCredential"
  role  = aws_iam_role.host.name
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["ssm:GetParameter"], Resource = ["arn:aws:ssm:us-east-1:083919364732:parameter/lw-analytics-pilot/backfill-source"] }
  ] })
}
