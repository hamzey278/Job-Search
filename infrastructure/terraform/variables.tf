variable "aws_region" {
  type        = string
  description = "Target AWS deployment region"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Target stage environment naming"
  default     = "production"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block allocated for the virtual network"
  default     = "10.0.0.0/16"
}

variable "db_username" {
  type        = string
  description = "Administrative user for RDS PostgreSQL database"
  default     = "dbadmin"
}

variable "db_password" {
  type        = string
  description = "RDS master password"
  sensitive   = true
}

variable "s3_bucket_prefix" {
  type        = string
  description = "Prefix for the S3 bucket to ensure global uniqueness"
  default     = "jobportal-resumes"
}
