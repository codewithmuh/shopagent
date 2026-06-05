from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Fargate, ECS
from diagrams.aws.database import RDS, ElastiCache
from diagrams.aws.network import ALB, Route53, NATGateway
from diagrams.aws.security import SecretsManager, ACM
from diagrams.aws.devtools import Codebuild
from diagrams.aws.management import Cloudwatch
from diagrams.aws.compute import ECR
from diagrams.onprem.client import Users
from diagrams.onprem.vcs import Github
from diagrams.saas.cdn import Cloudflare
from diagrams.programming.framework import Django, React
from diagrams.custom import Custom

graph_attr = {
    "fontsize": "28",
    "bgcolor": "#ffffff",
    "pad": "0.4",
    "splines": "curved",
    "nodesep": "0.7",
    "ranksep": "0.9",
    "dpi": "200",
}

with Diagram(
    "ShopAgent — AWS Production Infrastructure",
    filename="shopagent-architecture",
    show=False,
    direction="TB",
    graph_attr=graph_attr,
    outformat="png",
):

    # ── Ingress ──
    with Cluster(
        "Traffic Ingress",
        graph_attr={"bgcolor": "#e3f2fd", "margin": "12"},
    ):
        users = Users("Users / Mobile Apps")
        cf = Cloudflare("Cloudflare DNS\nexample.com\napi.example.com")
        acm = ACM("ACM SSL\n*.example.com\nWildcard")
        alb = ALB("ALB\nHTTPS :443\nHTTP → HTTPS redirect\nWebSocket support")

    # CI/CD
    github = Github("GitHub Actions\nBuild → ECR → Deploy")

    # ── VPC ──
    with Cluster(
        "VPC 10.0.0.0/16  ·  us-east-1 (N. Virginia)  ·  53 Resources",
        graph_attr={
            "bgcolor": "#fafafa",
            "fontsize": "18",
            "style": "rounded",
            "penwidth": "2",
            "margin": "16",
        },
    ):
        # Public subnet
        with Cluster(
            "Public Subnets (10.0.1.0/24 + 10.0.2.0/24)",
            graph_attr={"bgcolor": "#e8f5e9", "margin": "10"},
        ):
            nat = NATGateway("NAT Gateway\nElastic IP")

        # ECS Fargate
        with Cluster(
            "ECS Fargate Cluster (shopagent-cluster)",
            graph_attr={"bgcolor": "#fff3e0", "margin": "12"},
        ):
            backend = Fargate("Backend\nDjango + Daphne\n512 CPU · 1024 MB\nPort 8000")
            frontend = Fargate("Frontend\nNext.js 16\n256 CPU · 512 MB\nPort 3000")

        # Data stores
        with Cluster(
            "Managed Data · Private Subnets · Encrypted",
            graph_attr={"bgcolor": "#e8f5e9", "margin": "12"},
        ):
            rds = RDS("PostgreSQL 16.6\ndb.t3.micro · 20GB\n7-day backups\nPort 5432")
            redis = ElastiCache("Redis 7.1\ncache.t3.micro\nWS Channels · Cache\nPort 6379")

    # ── Platform Services ──
    with Cluster(
        "AWS Platform Services",
        graph_attr={"bgcolor": "#f3e5f5", "margin": "10"},
    ):
        ecr = ECR("ECR\nshopagent/backend\nshopagent/frontend")
        secrets = SecretsManager("Secrets Manager\nAPI Keys · DB Pass\nDjango Secret")
        cw = Cloudwatch("CloudWatch\nLogs · 30 days\nbackend + frontend")
        r53 = Route53("Route 53\nHosted Zone\nACM Validation")

    # ── External APIs ──
    with Cluster(
        "External Integrations",
        graph_attr={"bgcolor": "#fce4ec", "margin": "10"},
    ):
        claude = Fargate("Anthropic Claude\nAI Agent\ntool-use")
        openai = Fargate("OpenAI TTS\nNova Voice")
        shopify = Fargate("Shopify API\nProduct Sync\nInventory")
        webhooks = Fargate("Company Webhooks\nbalance_check\ncharge")

    # ── Connections ──

    # Ingress flow
    users >> Edge(color="#1565C0", style="bold") >> cf
    cf >> Edge(color="#2E7D32") >> acm
    acm >> Edge(color="#E65100") >> alb

    # ALB routing
    alb >> Edge(
        label="api.example.com/*", color="#E65100", style="bold"
    ) >> backend
    alb >> Edge(
        label="example.com/* (default)", color="#2E7D32", style="bold"
    ) >> frontend

    # CI/CD
    github >> Edge(label="Deploy", color="#333", style="bold") >> ecr
    ecr >> Edge(color="#333", style="dashed") >> backend
    ecr >> Edge(color="#333", style="dashed") >> frontend

    # Backend → Data
    backend >> Edge(color="#2E7D32", label="SQL") >> rds
    backend >> Edge(color="#C62828", label="Cache/WS") >> redis

    # Backend → External (via NAT)
    backend >> Edge(color="#6A1B9A", style="dashed") >> claude
    backend >> Edge(color="#0277BD", style="dashed") >> openai
    backend >> Edge(color="#4CAF50", style="dashed") >> shopify
    backend >> Edge(color="#FF6F00", style="dashed") >> webhooks
    backend >> Edge(color="#78909C", style="dotted") >> nat

    # Secrets injection
    secrets >> Edge(color="#FF6F00", style="dotted", label="inject") >> backend

    # Monitoring
    backend >> Edge(color="#9E9E9E", style="dotted") >> cw
    frontend >> Edge(color="#9E9E9E", style="dotted") >> cw
