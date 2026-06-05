output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "route53_nameservers" {
  value       = aws_route53_zone.main.name_servers
  description = "Set these nameservers at your domain registrar for example.com"
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.main.cache_nodes[0].address
}

output "ecr_backend_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}
