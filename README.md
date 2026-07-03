# Task Management — AWS Production Deployment

Full-stack task management app deployed on AWS with ECS Fargate, RDS, ElastiCache, ALB, and CI/CD via GitHub Actions.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + Tailwind CSS |
| Backend | NestJS + TypeORM |
| Database | PostgreSQL (AWS RDS) |
| Cache | Redis (AWS ElastiCache) |
| Container Registry | AWS ECR |
| Orchestration | AWS ECS Fargate |
| Load Balancer | AWS ALB |
| DNS | DuckDNS + Lambda IP updater |
| Infrastructure | Terraform |
| CI/CD | GitHub Actions |

---

## Architecture

```
User types: http://task-mng.duckdns.org
                    │
                    ▼
         DuckDNS resolves → ALB IP
         (Lambda keeps this updated every 5 min)
                    │
                    ▼
              ALB port 80
                    │
         ┌──────────┴──────────┐
         │                     │
      /api/*                  /*
         │                     │
         ▼                     ▼
   ECS Backend           ECS Frontend
   (NestJS x2)           (Next.js x2)
         │
    ┌────┴────┐
    ▼         ▼
   RDS     ElastiCache
 (store)   (cache)
```

---

## AWS Services Explained

### VPC
Your own private network inside AWS. Public subnets hold the ALB. Private subnets hold ECS, RDS, and Redis — never exposed to the internet.

### Internet Gateway
The main gate of your VPC. Allows traffic between your VPC and the internet.

### NAT Gateway
Allows private subnet containers to reach the internet (pull Docker images, etc.) without being reachable from outside.

### Security Groups
Firewall rules per service:
- **ALB** → accepts port 80 from everyone
- **ECS** → accepts traffic only from ALB
- **RDS** → accepts port 5432 only from ECS
- **Redis** → accepts port 6379 only from ECS

### ECR (Elastic Container Registry)
AWS private Docker registry. Stores backend and frontend images. GitHub Actions builds and pushes here, ECS pulls from here.

### RDS (PostgreSQL)
Managed database. AWS handles backups, patches, and hardware. All tasks stored here permanently in a private subnet.

### ElastiCache (Redis)
Managed Redis cache. Caches `GET /api/tasks` for 60 seconds. Cache is busted on every create, update, or delete. Reduces RDS load significantly.

### ALB (Application Load Balancer)
Single entry point. Routes `/api/*` to the backend and `/*` to the frontend. Runs health checks on every container and removes unhealthy ones automatically.

### ECS Fargate
Runs Docker containers without managing servers. Two services run 2 replicas each. If a container crashes, ECS automatically replaces it.

### Lambda (DuckDNS Updater)
Runs every 5 minutes. Resolves the ALB DNS name to its current IP and updates DuckDNS so `task-mng.duckdns.org` always points to the ALB.

### CloudWatch
Collects logs from all containers. Log groups: `/ecs/task-management/backend` and `/ecs/task-management/frontend`. Retention: 7 days.

### S3 (Terraform State)
Stores Terraform's memory of what infrastructure exists. Without it Terraform can't update or destroy resources correctly.

### IAM Roles
- **ECS Task Execution Role** → allows ECS to pull from ECR and write to CloudWatch
- **Lambda Role** → allows Lambda to write logs to CloudWatch

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
│   ├── alb.tf                  ← Load balancer + health checks
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
Test → Bootstrap ECR → Build images → Push to ECR → Terraform apply → Live
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
| `app_url` | http://task-mng.duckdns.org |

---

## Infrastructure Costs (approximate)

| Service | Instance | Cost/mo |
|---|---|---|
| ECS Fargate (backend x2) | 0.5 vCPU / 1GB | ~$16 |
| ECS Fargate (frontend x2) | 0.25 vCPU / 512MB | ~$8 |
| RDS PostgreSQL | db.t3.micro | ~$15 |
| ElastiCache Redis | cache.t3.micro | ~$12 |
| ALB | — | ~$16 |
| NAT Gateway | — | ~$32 |
| Lambda | free tier | ~$0 |
| ECR | free tier | ~$0 |
| **Total** | | **~$99/mo** |

---

## Secrets Management

| Where | How |
|---|---|
| Local dev | `.env` file (never committed) |
| CI/CD | GitHub Secrets |
| Runtime | Environment variables via ECS task definition |

---

## Destroying Infrastructure

### Option 1 — Terraform (recommended)

```bash
cd terraform
terraform destroy \
  -var="db_user=YOUR_DB_USER" \
  -var="db_pass=YOUR_DB_PASS" \
  -var="duckdns_token=YOUR_TOKEN" \
  -var="backend_image=placeholder" \
  -var="frontend_image=placeholder"
```

Type `yes` when prompted.

### Option 2 — AWS Console (delete in this order)

```
1. ECS         → delete backend + frontend services → delete cluster
2. ALB         → delete task-management-alb
3. RDS         → delete task-management-postgres (skip final snapshot)
4. ElastiCache → delete task-management-redis
5. ECR         → delete both repositories
6. Lambda      → delete task-management-duckdns-updater
7. VPC         → delete task-management VPC
8. EC2         → Elastic IPs → release NAT gateway EIP
9. CloudWatch  → delete /ecs/task-management/* log groups
10. S3         → empty and delete task-management-tf-state
```

### Delete These First to Stop Costs Immediately

| Service | Cost/hr | Action |
|---|---|---|
| NAT Gateway | $0.045 | Delete first |
| ALB | $0.022 | Delete second |
| RDS | $0.017 | Delete third |
| ElastiCache | $0.017 | Delete fourth |
| ECS Fargate | $0.016 | Stops when service deleted |
