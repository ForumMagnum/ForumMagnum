variable "subnet_id" { type = string }
variable "ami_id" { type = string } # Pinned Ubuntu 24.04 amd64 AMI, verified in this account/region.
variable "query_client_security_group_id" { type = string }
variable "source_security_group_id" { type = string }
variable "source_rds_identifier" { type = string }
variable "gateway_hostname" {
  type        = string
  description = "TLS certificate hostname; private DNS resolves it to EC2 for clients."
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]*[a-z0-9]$", var.gateway_hostname))
    error_message = "Supply a DNS hostname without protocol, path, or port."
  }
}
variable "archive_bucket_name" { type = string }
variable "backup_bucket_name" { type = string }
variable "worker_secret_arn" { type = string }
variable "control_secret_arn" { type = string }
variable "artifact_object_arn" { type = string }
variable "artifact_uri" { type = string }
variable "artifact_sha256" {
  type = string
  validation {
    condition     = can(regex("^[a-f0-9]{64}$", var.artifact_sha256))
    error_message = "Supply the reviewed release bundle SHA-256."
  }
}
variable "alert_topic_arn" { type = string }
variable "data_gib" { type = number } # Measured dataset + merge/staging/growth headroom.
variable "daily_schedule" {
  type    = string
  default = "cron(0 10 * * ? *)"
}
variable "daily_runtime_alert_minutes" {
  type    = number
  default = 180
}
variable "schedules_enabled" {
  type    = bool
  default = false
}
variable "rollout_approved" {
  type    = bool
  default = false
}
variable "network_and_costs_reviewed" {
  type    = bool
  default = false
}
