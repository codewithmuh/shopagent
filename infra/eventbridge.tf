# ── EventBridge Scheduled Rule: Order Follow-up Cron ──────────────────────────
# Runs `python manage.py send_followups` every 4 hours via ECS Fargate

resource "aws_cloudwatch_event_rule" "followup_cron" {
  name                = "shopagent-followup-cron"
  description         = "Trigger order follow-up cron every 4 hours"
  schedule_expression = "rate(4 hours)"
  state               = "ENABLED"
}

resource "aws_cloudwatch_event_target" "followup_ecs" {
  rule      = aws_cloudwatch_event_rule.followup_cron.name
  target_id = "shopagent-followup-ecs"
  arn       = aws_ecs_cluster.main.arn
  role_arn  = aws_iam_role.eventbridge_ecs.arn

  ecs_target {
    task_definition_arn = aws_ecs_task_definition.backend.arn
    task_count          = 1
    launch_type         = "FARGATE"

    network_configuration {
      subnets          = [aws_subnet.private_a.id]
      security_groups  = [aws_security_group.backend.id]
      assign_public_ip = false
    }
  }

  input = jsonencode({
    containerOverrides = [
      {
        name    = "backend"
        command = ["python", "manage.py", "send_followups"]
      }
    ]
  })
}

# IAM role for EventBridge to run ECS tasks
resource "aws_iam_role" "eventbridge_ecs" {
  name = "shopagent-eventbridge-ecs"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "events.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "eventbridge_ecs" {
  name = "shopagent-eventbridge-ecs-policy"
  role = aws_iam_role.eventbridge_ecs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ecs:RunTask"]
        Resource = aws_ecs_task_definition.backend.arn
      },
      {
        Effect   = "Allow"
        Action   = ["iam:PassRole"]
        Resource = [
          aws_iam_role.ecs_execution.arn,
          aws_iam_role.ecs_task.arn,
        ]
      }
    ]
  })
}
