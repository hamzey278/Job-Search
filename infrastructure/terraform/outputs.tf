output "vpc_id" {
  value       = aws_vpc.main.id
  description = "Created VPC Identifier"
}

output "alb_dns_name" {
  value       = aws_lb.external.dns_name
  description = "Application Load Balancer Public entrypoint URL"
}

output "database_endpoint" {
  value       = aws_db_instance.postgres.endpoint
  description = "RDS database engine endpoint"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.resumes.id
  description = "AWS S3 storage bucket name allocated for resumes"
}
