variable "aws_region" {
  default = "us-east-1"
}

variable "project" {
  default = "task-management"
}

variable "environment" {
  default = "production"
}

# Database
variable "db_user" {
  sensitive = true
}

variable "db_pass" {
  sensitive = true
}

variable "db_name" {
  default = "taskdb"
}

# DuckDNS
variable "duckdns_token" {
  sensitive = true
}

variable "duckdns_domain" {
  default = "task-mng"
}

# ECR image URIs (filled by CI/CD)
variable "backend_image" {
  description = "ECR image URI for backend"
}

variable "frontend_image" {
  description = "ECR image URI for frontend"
}
