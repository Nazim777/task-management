# Task Management — AWS Production Deployment

Full-stack task management app deployed on AWS with ECS Fargate, RDS, ElastiCache, ALB, and CI/CD via GitHub Actions.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + Tailwind CSS |
| Backend | NestJS + TypeORM |
| Database | PostgreSQL (AWS RDS) |
| Cache | Redis (AWS ElastiCache) |
| Container Registry | AWS ECR |
| Orchestration | AWS ECS Fargate |
| Load Balancer | AWS ALB + ACM SSL |
| DNS | DuckDNS + Lambda IP updater |
| Infrastructure | Terraform |
| CI/CD | GitHub Actions |

---

## Architecture

```
Browser
   │
   ▼
https://task-mng.duckdns.org
   │
   ▼
AWS ALB (port 443 — SSL terminated here)
   │
   ├── /api/*  ──► ECS Fargate (NestJS backend x2)
   │                    │
   │                    ├── RDS PostgreSQL
   │                    └── ElastiCache Redis
   │
   └── /*      ──► ECS Fargate (Next.js frontend x2)

Lambda (every 5 min) ──► resolves ALB IP ──► updates DuckDNS
```

---

## Project Structure

```
task-management-aws/
├── .github/workflows/
│   └── deploy.yml              ← CI/CD pipeline
├── terraform/
│   ├── main.tf                 ← provider + S3 backend
│   ├── variables.tf            ← all variables
│   ├── vpc.tf                  ← VPC, subnets, security groups
│   ├── rds.tf                  ← PostgreSQL on RDS
│   ├── elasticache.tf          ← Redis on ElastiCache
│   ├── ecr.tf                  ← Docker image registries
│   ├── alb.tf                  ← Load balancer + ACM SSL
│   ├── ecs.tf                  ← Fargate services
│   ├── lambda.tf               ← DuckDNS IP updater
│   ├── outputs.tf              ← ALB URL, ECR URLs etc
│   └── terraform.tfvars.example
├── lambda/
│   └── duckdns_updater.py      ← runs every 5 min, updates DuckDNS IP
├── backend/                    ← NestJS app
├── frontend/                   ← Next.js app
├── nginx/nginx.conf            ← local dev only
├── docker-compose.yml          ← local dev only
├── .env.example
└── .gitignore
```

---

## How to Deploy

### 1. Create GitHub repo and push

```bash
cd task-management-aws
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/task-management-aws
git push -u origin main
```

### 2. Add GitHub Secrets

Go to: `GitHub repo → Settings → Secrets → Actions`

| Secret | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | Your AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS IAM secret key |
| `DB_USER` | Postgres username e.g. `postgres` |
| `DB_PASS` | Strong postgres password |
| `DUCKDNS_TOKEN` | Your DuckDNS token (from duckdns.org) |

### 3. Create S3 bucket for Terraform state (once)

```bash
aws s3 mb s3://task-management-tf-state --region us-east-1
```

### 4. Push to main — everything deploys automatically

```bash
git push origin main
```

### 5. CI/CD Pipeline runs

```
Test → Build images → Push to ECR → Terraform apply → Live
```

---

## What You Get

```
https://task-mng.duckdns.org   ← your app, HTTPS, auto-renewing
                                ← ALB routes /api/* to backend
                                ← Lambda keeps DuckDNS IP updated
                                ← RDS stores data persistently
                                ← ElastiCache caches API responses
                                ← ECS Fargate runs 2 replicas each
                                ← CloudWatch logs everything
```

---

## Local Development

```bash
cp .env.example .env       # fill in values
docker-compose up --build  # runs on http://localhost
```

Local stack uses Docker Compose with Nginx, Postgres, and Redis containers. No AWS needed for local dev.

---

## Terraform Outputs

After `terraform apply` you get:

| Output | Description |
|---|---|
| `alb_dns_name` | ALB DNS — Lambda points DuckDNS here |
| `backend_ecr_url` | ECR URL for backend image |
| `frontend_ecr_url` | ECR URL for frontend image |
| `rds_endpoint` | RDS PostgreSQL endpoint |
| `redis_endpoint` | ElastiCache Redis endpoint |
| `app_url` | https://task-mng.duckdns.org |

---

## Infrastructure Costs (approximate)

| Service | Instance | Cost/mo |
|---|---|---|
| ECS Fargate (backend x2) | 0.25 vCPU / 512MB | ~$8 |
| ECS Fargate (frontend x2) | 0.25 vCPU / 512MB | ~$8 |
| RDS PostgreSQL | db.t3.micro | ~$15 |
| ElastiCache Redis | cache.t3.micro | ~$12 |
| ALB | — | ~$16 |
| Lambda | free tier | ~$0 |
| ECR | free tier | ~$0 |
| **Total** | | **~$59/mo** |

---

## Secrets Management

- Local dev: `.env` file (never committed)
- CI/CD: GitHub Secrets
- Runtime: AWS Secrets Manager (DB credentials)
- Never hardcoded anywhere in code or Terraform

---

## Destroying Infrastructure

```bash
cd terraform
terraform destroy \
  -var="db_user=YOUR_DB_USER" \
  -var="db_pass=YOUR_DB_PASS" \
  -var="duckdns_token=YOUR_TOKEN" \
  -var="backend_image=placeholder" \
  -var="frontend_image=placeholder"
```
