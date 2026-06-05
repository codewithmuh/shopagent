# ── CloudWatch Log Groups ────────────────────────────────
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.project}/backend"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.project}/frontend"
  retention_in_days = 30
}

# ── ECS Cluster ──────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${var.project}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = { Name = "${var.project}-cluster" }
}

# ── Backend Task Definition ──────────────────────────────
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "backend"
    image = "${aws_ecr_repository.backend.repository_url}:latest"

    portMappings = [{
      containerPort = 8000
      protocol      = "tcp"
    }]

    environment = [
      { name = "DJANGO_SETTINGS_MODULE", value = "config.settings" },
      { name = "DB_HOST", value = aws_db_instance.main.address },
      { name = "DB_PORT", value = "5432" },
      { name = "DB_NAME", value = var.db_name },
      { name = "DB_USER", value = var.db_username },
      { name = "DB_PASSWORD", value = var.db_password },
      { name = "REDIS_URL", value = "redis://${aws_elasticache_cluster.main.cache_nodes[0].address}:6379/0" },
      { name = "ANTHROPIC_API_KEY", value = var.anthropic_api_key },
      { name = "OPENAI_API_KEY", value = var.openai_api_key },
      { name = "DJANGO_SECRET_KEY", value = var.django_secret_key },
      { name = "ALLOWED_HOSTS", value = "api.${var.domain},${var.domain},*" },
      { name = "CORS_ALLOWED_ORIGINS", value = "https://${var.domain},https://api.${var.domain}" },
      { name = "SHOPIFY_API_KEY", value = var.shopify_api_key },
      { name = "SHOPIFY_API_SECRET", value = var.shopify_api_secret },
      { name = "AWS_ACCESS_KEY_ID", value = var.aws_access_key_id },
      { name = "AWS_SECRET_ACCESS_KEY", value = var.aws_secret_access_key },
      { name = "AWS_S3_BUCKET_NAME", value = "shopagent-product-images" },
      { name = "AWS_S3_REGION", value = var.aws_region },
      { name = "ENVIRONMENT", value = "production" },
      { name = "DEBUG", value = "False" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.backend.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "backend"
      }
    }

    essential = true

    # Run migrations, seed, then start daphne
    command = [
      "sh", "-c",
      "python manage.py migrate && daphne -b 0.0.0.0 -p 8000 config.asgi:application"
    ]
  }])
}

# ── Frontend Task Definition ─────────────────────────────
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.project}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.frontend_cpu
  memory                   = var.frontend_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "frontend"
    image = "${aws_ecr_repository.frontend.repository_url}:latest"

    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]

    environment = [
      { name = "NEXT_PUBLIC_API_URL", value = "https://api.${var.domain}" },
      { name = "NEXT_PUBLIC_WS_URL", value = "wss://api.${var.domain}" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "frontend"
      }
    }

    essential = true
  }])
}

# ── Backend Service ──────────────────────────────────────
resource "aws_ecs_service" "backend" {
  name            = "${var.project}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.private_a.id]
    security_groups  = [aws_security_group.backend.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 8000
  }

  # Allow new deployments to replace running tasks
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 200

  # Enable stickiness for WebSocket
  enable_execute_command = true

  depends_on = [aws_lb_listener.https]
}

# ── Frontend Service ─────────────────────────────────────
resource "aws_ecs_service" "frontend" {
  name            = "${var.project}-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.private_a.id]
    security_groups  = [aws_security_group.frontend.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 3000
  }

  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 200

  depends_on = [aws_lb_listener.https]
}
