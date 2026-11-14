variable "backfill_enabled" {
  type    = bool
  default = false
}
variable "data_gib" {
  type    = number
  default = 100
  validation {
    condition     = var.data_gib >= 100 && var.data_gib <= 512
    error_message = "The evaluated pilot allows 100-512 GiB."
  }
}
variable "max_runtime_hours" {
  type    = number
  default = 4
  validation {
    condition     = var.max_runtime_hours > 0 && var.max_runtime_hours <= 144
    error_message = "Pilot runs must stop within six days."
  }
}
