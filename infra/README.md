# Infrastructure (Terraform — optional)

This directory contains **optional** Terraform for deploying ShopAgent to AWS. You do **not**
need any of this to run the project — local development uses Docker Compose (`make up`). This
is here so the build-along can show a realistic production topology.

## What it provisions

A container-based production stack on AWS:

| File | Resources |
|------|-----------|
| `vpc.tf` | VPC, public/private subnets, NAT, routing |
| `security_groups.tf` | ALB / app / data-tier security groups |
| `ecs.tf` | ECS **Fargate** cluster + backend & frontend services/tasks |
| `ecr.tf` | ECR repositories for the backend & frontend images |
| `rds.tf` | PostgreSQL (RDS) |
| `elasticache.tf` | Redis (ElastiCache) |
| `alb.tf` | Application Load Balancer + listener rules (api vs app) |
| `acm.tf` / `route53.tf` | TLS certificate + DNS records |
| `iam.tf` | Task execution / task roles, SSM parameter access |
| `eventbridge.tf` | Scheduled task (post-order delivery follow-ups) |
| `main.tf` / `variables.tf` / `outputs.tf` | Provider, inputs, outputs |

## Configure

Inputs are defined in `variables.tf` (defaults: `project = "shopagent"`,
`aws_region = "us-east-1"`, `domain = "example.com"`). Copy the example tfvars and fill in
your own values and secrets:

```bash
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars — set domain, db_password, and the *_api_key / *_secret_key values
```

> ⚠️ `terraform.tfvars` and all `*.tfstate` files are git-ignored — they contain secrets and
> must never be committed.

## Apply

```bash
terraform init
terraform plan
terraform apply
```

Then build & push the container images and point your domain at the ALB — see the top-level
**[DEPLOYMENT.md](../DEPLOYMENT.md)** for the full push/deploy runbook. All account-specific
values in these files are placeholders; substitute your own AWS account id, region, and domain.

## Architecture diagram

- Rendered: open `architecture-diagram.html` in a browser.
- Regenerate (needs the [`diagrams`](https://diagrams.mingrammer.com/) Python package + Graphviz):
  ```bash
  python generate_diagram.py
  ```
