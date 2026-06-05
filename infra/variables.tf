variable "aws_region" {
  default = "us-east-1"
}

variable "project" {
  default = "shopagent"
}

variable "environment" {
  default = "prod"
}

variable "domain" {
  default = "example.com"
}

variable "az" {
  description = "Single availability zone"
  default     = "us-east-1a"
}

# ── Database ─────────────────────────────────────────────
variable "db_instance_class" {
  default = "db.t3.micro"
}

variable "db_name" {
  default = "shopagent"
}

variable "db_username" {
  default = "shopagent_admin"
}

variable "db_password" {
  type      = string
  sensitive = true
}

# ── Redis ────────────────────────────────────────────────
variable "redis_node_type" {
  default = "cache.t3.micro"
}

# ── ECS ──────────────────────────────────────────────────
variable "backend_cpu" {
  default = 512
}

variable "backend_memory" {
  default = 1024
}

variable "frontend_cpu" {
  default = 256
}

variable "frontend_memory" {
  default = 512
}

# ── App Secrets (passed at apply time) ───────────────────
variable "anthropic_api_key" {
  type      = string
  sensitive = true
}

variable "openai_api_key" {
  type      = string
  sensitive = true
}

variable "django_secret_key" {
  type      = string
  sensitive = true
}

variable "shopify_api_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "shopify_api_secret" {
  type      = string
  sensitive = true
  default   = ""
}

variable "aws_access_key_id" {
  type      = string
  sensitive = true
  default   = ""
}

variable "aws_secret_access_key" {
  type      = string
  sensitive = true
  default   = ""
}
