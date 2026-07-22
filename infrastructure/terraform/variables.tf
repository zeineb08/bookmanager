# ============================================================
# BookManager - Terraform Variables
# ============================================================

variable "aws_region" {
  description = "AWS region to deploy to"
  type        = string
  default     = "eu-west-1"
}

variable "mongodb_atlas_public_key" {
  description = "MongoDB Atlas API Public Key"
  type        = string
  sensitive   = true
}

variable "mongodb_atlas_private_key" {
  description = "MongoDB Atlas API Private Key"
  type        = string
  sensitive   = true
}

variable "mongodb_atlas_org_id" {
  description = "MongoDB Atlas Organization ID"
  type        = string
}

variable "mongodb_atlas_app_password" {
  description = "Password for the application database user"
  type        = string
  sensitive   = true
}

variable "ssl_certificate_arn" {
  description = "ARN of the SSL certificate in ACM"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "bookmanager.example.com"
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_security_group" "alb" {
  name        = "bookmanager-alb-sg"
  description = "ALB security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "bookmanager-alb-sg" }
}
