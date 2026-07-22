# ============================================================
# BookManager - Production Infrastructure with Terraform
# ============================================================
# Deploys to AWS (ECS Fargate) + MongoDB Atlas
# ============================================================

terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.0"
    }
  }

  backend "s3" {
    bucket = "bookmanager-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "eu-west-1"
  }
}

provider "aws" {
  region = var.aws_region
}

provider "mongodbatlas" {
  public_key  = var.mongodb_atlas_public_key
  private_key = var.mongodb_atlas_private_key
}

# ============================================================
# MongoDB Atlas Cluster
# ============================================================

resource "mongodbatlas_project" "bookmanager" {
  name   = "BookManager-Production"
  org_id = var.mongodb_atlas_org_id
}

resource "mongodbatlas_cluster" "bookmanager" {
  project_id = mongodbatlas_project.bookmanager.id
  name       = "BookManager-Cluster"

  provider_name               = "AWS"
  provider_region_name        = var.aws_region
  provider_instance_size_name = "M10"  # Production grade (M0=M2 free, M10=production)
  cloud_backup                = true
  auto_scaling_disk_gb_enabled = true

  # Advanced config
  advanced_configuration {
    javascript_enabled           = true
    minimum_enabled_tls_protocol = "1.2"
  }
}

# Database user for the application
resource "mongodbatlas_database_user" "app_user" {
  project_id = mongodbatlas_project.bookmanager.id
  username   = "bookmanager-app"
  password   = var.mongodb_atlas_app_password

  roles {
    role_name     = "readWrite"
    database_name = "bookmanager"
  }

  scopes {
    name = mongodbatlas_cluster.bookmanager.name
    type = "CLUSTER"
  }
}

# IP Access List (allow only the ECS service)
resource "mongodbatlas_project_ip_access_list" "ecs" {
  project_id = mongodbatlas_project.bookmanager.id
  comment    = "ECS Fargate Service"
  ip_address = aws_ecs_service.bookmanager_backend.*. platform_version[0]
}

# Get the connection string
data "mongodbatlas_cluster" "bookmanager" {
  project_id = mongodbatlas_project.bookmanager.id
  name       = mongodbatlas_cluster.bookmanager.name
}

# ============================================================
# AWS Networking
# ============================================================

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "bookmanager-vpc" }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "bookmanager-public-${count.index}" }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = { Name = "bookmanager-private-${count.index}" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "bookmanager-igw" }
}

resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "bookmanager-nat-eip" }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  tags          = { Name = "bookmanager-nat" }
}

# Route tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "bookmanager-public-rt" }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = { Name = "bookmanager-private-rt" }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Security groups
resource "aws_security_group" "backend" {
  name        = "bookmanager-backend-sg"
  description = "Backend security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "bookmanager-backend-sg" }
}

# ============================================================
# ECS Cluster & Service
# ============================================================

resource "aws_ecs_cluster" "main" {
  name = "bookmanager-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "bookmanager-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "backend"
      image = "${aws_ecr_repository.backend.repository_url}:latest"
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" },
        { name = "CORS_ORIGIN", value = "https://bookmanager.example.com" }
      ]

      secrets = [
        {
          name      = "MONGODB_URI"
          valueFrom = aws_secretsmanager_secret.mongodb_uri.arn
        },
        {
          name      = "JWT_SECRET"
          valueFrom = aws_secretsmanager_secret.jwt_secret.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/api/auth/login || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
}

resource "aws_ecs_service" "backend" {
  name            = "bookmanager-backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.backend.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 3000
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = { Name = "bookmanager-backend-service" }
}

# ============================================================
# Application Load Balancer
# ============================================================

resource "aws_lb" "main" {
  name               = "bookmanager-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id

  enable_deletion_protection = true

  tags = { Name = "bookmanager-alb" }
}

resource "aws_lb_target_group" "backend" {
  name        = "bookmanager-backend-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = "/api/auth/login"
    port                = "traffic-port"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
  }

  tags = { Name = "bookmanager-backend-tg" }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.ssl_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# ============================================================
# ECR Repositories
# ============================================================

resource "aws_ecr_repository" "backend" {
  name = "bookmanager-backend"
  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "frontend" {
  name = "bookmanager-frontend"
  image_scanning_configuration {
    scan_on_push = true
  }
}

# ============================================================
# Secrets Manager
# ============================================================

resource "aws_secretsmanager_secret" "mongodb_uri" {
  name        = "bookmanager/mongodb-uri"
  description = "MongoDB Atlas connection URI"
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name        = "bookmanager/jwt-secret"
  description = "JWT signing secret"
}

# ============================================================
# CloudWatch Logs
# ============================================================

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/bookmanager-backend"
  retention_in_days = 30
}

# ============================================================
# IAM Roles
# ============================================================

resource "aws_iam_role" "ecs_execution" {
  name = "bookmanager-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role" "ecs_task" {
  name = "bookmanager-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# ============================================================
# Outputs
# ============================================================

output "mongodb_atlas_connection_string" {
  value     = "mongodb+srv://bookmanager-app:${var.mongodb_atlas_app_password}@${mongodbatlas_cluster.bookmanager.name}.mongodb.net/bookmanager?retryWrites=true&w=majority"
  sensitive = true
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "ecr_backend_repo" {
  value = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repo" {
  value = aws_ecr_repository.frontend.repository_url
}
