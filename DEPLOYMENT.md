# ShopAgent — Production Deployment Guide

## Architecture

```
                    Cloudflare DNS
                         │
            ┌────────────┼────────────┐
            │            │            │
        example.com    api.example.com   *.example.com
            │            │
            └─────┬──────┘
                  │
          ┌───────▼────────┐
          │   ALB (HTTPS)  │   ← ACM wildcard cert
          │   Port 443     │
          └───┬────────┬───┘
              │        │
     ┌────────▼──┐  ┌──▼────────┐
     │ Frontend  │  │ Backend   │
     │ ECS Task  │  │ ECS Task  │
     │ Port 3000 │  │ Port 8000 │
     └───────────┘  └──┬────┬───┘
                       │    │
              ┌────────▼┐  ┌▼────────┐
              │   RDS    │  │  Redis  │
              │ Postgres │  │ ElastiC │
              └──────────┘  └─────────┘
```

## URLs

| Environment | Frontend | Backend API | WebSocket |
|-------------|----------|-------------|-----------|
| **Production** | https://example.com | https://api.example.com | wss://api.example.com/ws/chat/ |
| **Staging (EC2)** | https://app.example.com | https://app.example.com (same) | wss://app.example.com/ws/chat/ |

## AWS Resources

| Resource | Details | Region |
|----------|---------|--------|
| **Account** | <AWS_ACCOUNT_ID> | us-east-1 (N. Virginia) |
| **VPC** | shopagent-vpc (10.0.0.0/16) | us-east-1 |
| **ECS Cluster** | shopagent-cluster (Fargate) | us-east-1 |
| **RDS** | shopagent-postgres (PostgreSQL 16.6, db.t3.micro) | us-east-1a |
| **ElastiCache** | shopagent-redis (Redis 7.1, cache.t3.micro) | us-east-1a |
| **ALB** | shopagent-alb | us-east-1 |
| **ECR Backend** | <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopagent/backend |
| **ECR Frontend** | <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopagent/frontend |
| **Secrets** | AWS Secrets Manager → `shopagent/prod/credentials` |
| **Logs** | CloudWatch → `/ecs/shopagent/backend` and `/ecs/shopagent/frontend` |

## Deploying Changes

### Option 1: GitHub Actions (Recommended)

Push to the `production` branch triggers automatic deployment.

**One-time setup:**

1. Add GitHub repo secrets (`Settings → Secrets and variables → Actions`):
   ```
   AWS_ACCESS_KEY_ID     = <YOUR_AWS_ACCESS_KEY_ID>
   AWS_SECRET_ACCESS_KEY = (from your-aws-keys.csv)
   ```

2. Create the production branch:
   ```bash
   git checkout -b production
   git push -u origin production
   ```

**Deploying:**

```bash
# Develop on main
git add . && git commit -m "your changes"
git push origin main

# When ready to deploy to production
git checkout production
git merge main
git push origin production
# → GitHub Actions auto-builds, pushes to ECR, deploys to ECS
```

The workflow file is at `.github/workflows/deploy.yml`.

### Option 2: Manual Deploy (Local Docker)

Requires Docker Desktop running on your machine.

```bash
# Step 1: Login to ECR
aws ecr get-login-password --region us-east-1 --profile shopagent-prod \
  | docker login --username AWS --password-stdin \
    <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Step 2: Build images (--platform needed on Apple Silicon Macs)
docker build --platform linux/amd64 \
  -t <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopagent/backend:latest \
  ./backend

docker build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_WS_URL=wss://api.example.com \
  -t <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopagent/frontend:latest \
  ./frontend

# Step 3: Push to ECR
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopagent/backend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopagent/frontend:latest

# Step 4: Deploy to ECS (force new deployment)
aws ecs update-service --cluster shopagent-cluster --service shopagent-backend \
  --force-new-deployment --region us-east-1 --profile shopagent-prod

aws ecs update-service --cluster shopagent-cluster --service shopagent-frontend \
  --force-new-deployment --region us-east-1 --profile shopagent-prod
```

### Option 3: Deploy from EC2 (Staging Server)

If Docker isn't available locally, use the existing staging EC2.

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@<EC2_HOST>

# Login to ECR
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin \
    <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build and push (from /home/ubuntu/ai-stores)
cd /home/ubuntu/ai-stores
docker build -t <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopagent/backend:latest ./backend
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopagent/backend:latest

docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_WS_URL=wss://api.example.com \
  -t <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopagent/frontend:latest ./frontend
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopagent/frontend:latest

# Then from local machine, deploy to ECS
aws ecs update-service --cluster shopagent-cluster --service shopagent-backend \
  --force-new-deployment --region us-east-1 --profile shopagent-prod
aws ecs update-service --cluster shopagent-cluster --service shopagent-frontend \
  --force-new-deployment --region us-east-1 --profile shopagent-prod
```

## Deploy Only Backend or Frontend

You don't have to deploy both. Just build/push/deploy the one that changed:

```bash
# Backend only
docker build --platform linux/amd64 -t <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopagent/backend:latest ./backend
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopagent/backend:latest
aws ecs update-service --cluster shopagent-cluster --service shopagent-backend --force-new-deployment --region us-east-1 --profile shopagent-prod

# Frontend only
docker build --platform linux/amd64 --build-arg NEXT_PUBLIC_API_URL=https://api.example.com --build-arg NEXT_PUBLIC_WS_URL=wss://api.example.com -t <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopagent/frontend:latest ./frontend
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopagent/frontend:latest
aws ecs update-service --cluster shopagent-cluster --service shopagent-frontend --force-new-deployment --region us-east-1 --profile shopagent-prod
```

## Monitoring & Logs

### View logs
```bash
# Backend logs (last 100 lines)
aws logs tail /ecs/shopagent/backend --since 1h --follow --profile shopagent-prod --region us-east-1

# Frontend logs
aws logs tail /ecs/shopagent/frontend --since 1h --follow --profile shopagent-prod --region us-east-1
```

### Check service health
```bash
# ECS service status
aws ecs describe-services --cluster shopagent-cluster \
  --services shopagent-backend shopagent-frontend \
  --region us-east-1 --profile shopagent-prod \
  --query 'services[*].{name:serviceName,desired:desiredCount,running:runningCount}' \
  --output table

# ALB target health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:<AWS_ACCOUNT_ID>:targetgroup/shopagent-backend/<TARGET_GROUP_ID> \
  --region us-east-1 --profile shopagent-prod \
  --query 'TargetHealthDescriptions[*].{target:Target.Id,health:TargetHealth.State}' \
  --output table
```

### Health check endpoint
```bash
curl https://api.example.com/api/health/
# → {"status": "ok"}
```

## Django Management Commands

To run Django commands (superuser, migrations, shell, etc.), exec into the running backend container:

```bash
# 1. Get the running backend task ID
TASK_ID=$(aws ecs list-tasks --cluster shopagent-cluster --service-name shopagent-backend \
  --desired-status RUNNING --region us-east-1 --profile shopagent-prod \
  --query 'taskArns[0]' --output text)

# 2. Open a shell in the container
aws ecs execute-command --cluster shopagent-cluster \
  --task $TASK_ID --container backend \
  --interactive --command "/bin/sh" \
  --region us-east-1 --profile shopagent-prod

# 3. Inside the container, run any Django command:
python manage.py createsuperuser
python manage.py migrate
python manage.py shell
python manage.py dbshell
python manage.py seed
```

**Note:** You need the [Session Manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html) installed locally for `execute-command` to work.

```bash
# macOS install:
brew install --cask session-manager-plugin
```

## Database Access

RDS is in a private subnet (no public access). To connect:

```bash
# Use ECS Exec (same as above)
TASK_ID=$(aws ecs list-tasks --cluster shopagent-cluster --service-name shopagent-backend \
  --desired-status RUNNING --region us-east-1 --profile shopagent-prod \
  --query 'taskArns[0]' --output text)

aws ecs execute-command --cluster shopagent-cluster \
  --task $TASK_ID --container backend \
  --interactive --command "/bin/sh" \
  --region us-east-1 --profile shopagent-prod

# Then inside the container:
python manage.py dbshell
```

## Secrets

All production secrets are stored in AWS Secrets Manager:

```bash
# Retrieve all secrets
aws secretsmanager get-secret-value \
  --secret-id shopagent/prod/credentials \
  --region us-east-1 --profile shopagent-prod \
  --query SecretString --output text | python3 -m json.tool
```

## Infrastructure Changes

Terraform configs are in `infra/`. To modify infrastructure:

```bash
cd infra

# Preview changes
AWS_PROFILE=shopagent-prod terraform plan

# Apply changes
AWS_PROFILE=shopagent-prod terraform apply
```

**Important:** Terraform state is stored locally in `infra/terraform.tfstate`. Do not delete this file — it tracks all AWS resources.

## DNS (Cloudflare)

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| CNAME | `@` | `<ALB_DNS_NAME>` | DNS only |
| CNAME | `api` | `<ALB_DNS_NAME>` | DNS only |
| CNAME | `_849292...` | `_79e1113...acm-validations.aws.` | DNS only |

**Proxy must be DNS only (grey cloud)** — we use our own ACM SSL cert on the ALB.

## Estimated Monthly Cost

| Resource | Cost |
|----------|------|
| RDS (db.t3.micro) | ~$15-20 |
| ElastiCache (cache.t3.micro) | ~$15 |
| ECS Fargate (2 tasks) | ~$20-40 |
| ALB | ~$20 |
| NAT Gateway | ~$30 |
| ECR, CloudWatch, Route53 | ~$5 |
| **Total** | **~$105-130/month** |

## Troubleshooting

**ECS task keeps restarting:**
```bash
# Check stopped task reason
aws ecs list-tasks --cluster shopagent-cluster --service-name shopagent-backend --desired-status STOPPED --region us-east-1 --profile shopagent-prod
aws ecs describe-tasks --cluster shopagent-cluster --tasks <task-arn> --region us-east-1 --profile shopagent-prod --query 'tasks[0].{reason:stoppedReason,containers:containers[*].{name:name,exit:exitCode,reason:reason}}'
```

**Health check failing:**
```bash
# Check target health
aws elbv2 describe-target-health --target-group-arn <tg-arn> --region us-east-1 --profile shopagent-prod

# Check logs for errors
aws logs tail /ecs/shopagent/backend --since 30m --profile shopagent-prod --region us-east-1
```

**Database migration needed:**
Migrations run automatically on every backend deployment (part of the ECS task command). No manual migration needed.
