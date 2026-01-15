# AWS Deployment Guide for MediaMesh

This guide provides step-by-step instructions for deploying MediaMesh on AWS infrastructure.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [AWS Services Overview](#aws-services-overview)
- [Infrastructure Setup](#infrastructure-setup)
- [Service Deployment](#service-deployment)
- [Database Setup](#database-setup)
- [DynamoDB Integration](#dynamodb-integration)
- [Networking & Security](#networking--security)
- [Monitoring & Logging](#monitoring--logging)
- [Cost Optimization](#cost-optimization)

---

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Terraform or AWS CDK (optional, for IaC)
- Docker installed locally
- kubectl (if using EKS)

---

## AWS Services Overview

### Core Infrastructure

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **ECS/EKS** | Container orchestration | Fargate or EC2 instances |
| **RDS PostgreSQL** | Managed databases | Multi-AZ, automated backups |
| **DynamoDB** | NoSQL for high-traffic | On-demand or provisioned capacity |
| **ElastiCache Redis** | Caching and rate limiting | Cluster mode, multi-AZ |
| **MSK** | Managed Kafka | 3 brokers, multi-AZ |
| **S3** | Media assets storage | Versioning, lifecycle policies |
| **CloudFront** | CDN | Global distribution |
| **ALB** | Load balancing | Application Load Balancer |
| **CloudWatch** | Monitoring | Logs, metrics, alarms |

---

## Infrastructure Setup

### Step 1: VPC and Networking

**Create VPC with public and private subnets**:

```bash
# Using AWS CLI (or use AWS Console/Terraform)
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create public subnets (for ALB)
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.1.0/24 --availability-zone us-east-1a

# Create private subnets (for services)
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.2.0/24 --availability-zone us-east-1a
```

**Recommended Setup**:
- 2 public subnets (for ALB)
- 4 private subnets (2 for services, 2 for databases)
- NAT Gateway for private subnet internet access
- Internet Gateway for public subnets

### Step 2: Security Groups

**Create security groups**:

```bash
# ALB Security Group
aws ec2 create-security-group --group-name mediamesh-alb-sg --description "ALB Security Group"

# ECS/EKS Security Group
aws ec2 create-security-group --group-name mediamesh-ecs-sg --description "ECS Security Group"

# RDS Security Group
aws ec2 create-security-group --group-name mediamesh-rds-sg --description "RDS Security Group"

# ElastiCache Security Group
aws ec2 create-security-group --group-name mediamesh-cache-sg --description "ElastiCache Security Group"
```

**Security Group Rules**:
- ALB: Allow HTTP (80) and HTTPS (443) from internet
- ECS/EKS: Allow traffic from ALB only
- RDS: Allow PostgreSQL (5432) from ECS/EKS only
- ElastiCache: Allow Redis (6379) from ECS/EKS only

---

## Database Setup

### RDS PostgreSQL Setup

**Create RDS instances for each service**:

```bash
# User Service Database
aws rds create-db-instance \
  --db-instance-identifier mediamesh-user-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 16.1 \
  --master-username postgres \
  --master-user-password <secure-password> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --vpc-security-group-ids <rds-sg-id> \
  --db-subnet-group-name mediamesh-db-subnet-group \
  --multi-az \
  --backup-retention-period 7 \
  --enable-performance-insights

# Repeat for: cms-db, metadata-db, media-db, discovery-db, ingest-db, search-db
```

**Read Replicas for Discovery Service**:

```bash
# Create read replica for high read traffic
aws rds create-db-instance-read-replica \
  --db-instance-identifier mediamesh-discovery-db-replica-1 \
  --source-db-instance-identifier mediamesh-discovery-db \
  --db-instance-class db.t3.large
```

**Connection String Format**:
```
postgresql://username:password@mediamesh-user-db.xxxxx.us-east-1.rds.amazonaws.com:5432/user_db
```

### DynamoDB Setup

**Create DynamoDB tables**:

```bash
# Discovery Hot Data Table
aws dynamodb create-table \
  --table-name mediamesh-discovery-hot-data \
  --attribute-definitions \
    AttributeName=programId,AttributeType=S \
    AttributeName=category,AttributeType=S \
  --key-schema \
    AttributeName=programId,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=CategoryIndex,KeySchema=[{AttributeName=category,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=100,WriteCapacityUnits=10} \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=100,WriteCapacityUnits=10 \
  --time-to-live-specification Enabled=true,AttributeName=ttl

# Search Index Table
aws dynamodb create-table \
  --table-name mediamesh-search-index \
  --attribute-definitions \
    AttributeName=contentId,AttributeType=S \
    AttributeName=contentType,AttributeType=S \
  --key-schema \
    AttributeName=contentId,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=ContentTypeIndex,KeySchema=[{AttributeName=contentType,KeyType=HASH}],Projection={ProjectionType=ALL} \
  --billing-mode ON_DEMAND

# Rate Limiting Table
aws dynamodb create-table \
  --table-name mediamesh-rate-limits \
  --attribute-definitions \
    AttributeName=key,AttributeType=S \
  --key-schema \
    AttributeName=key,KeyType=HASH \
  --billing-mode ON_DEMAND \
  --time-to-live-specification Enabled=true,AttributeName=expiresAt
```

---

## Service Deployment

### Option 1: ECS (Fargate) Deployment

**Create ECS Cluster**:

```bash
aws ecs create-cluster --cluster-name mediamesh-cluster
```

**Create Task Definitions**:

```json
{
  "family": "mediamesh-discovery-gateway",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "discovery-gateway",
      "image": "<ecr-repo>/discovery-gateway:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "8080"}
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:jwt-secret"
        },
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mediamesh",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "discovery-gateway"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

**Create ECS Service**:

```bash
aws ecs create-service \
  --cluster mediamesh-cluster \
  --service-name discovery-gateway \
  --task-definition mediamesh-discovery-gateway \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:region:account:targetgroup/discovery-gateway-tg/xxx,containerName=discovery-gateway,containerPort=8080" \
  --enable-execute-command
```

### Option 2: EKS Deployment

**Create EKS Cluster**:

```bash
eksctl create cluster \
  --name mediamesh-cluster \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 10 \
  --managed
```

**Deploy Services with Kubernetes**:

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: discovery-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: discovery-gateway
  template:
    metadata:
      labels:
        app: discovery-gateway
    spec:
      containers:
      - name: discovery-gateway
        image: <ecr-repo>/discovery-gateway:latest
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
```

---

## DynamoDB Integration

### Discovery Service Integration

**Install AWS SDK**:

```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

**DynamoDB Client Setup**:

```typescript
// discovery-service/src/config/dynamodb.config.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export const docClient = DynamoDBDocumentClient.from(dynamoDBClient);
```

**Use DynamoDB for Hot Data**:

```typescript
// discovery-service/src/services/discovery.service.ts
import { docClient } from '../config/dynamodb.config';

async getPopularPrograms() {
  // Check DynamoDB first (hot data)
  const cached = await docClient.get({
    TableName: 'mediamesh-discovery-hot-data',
    Key: { programId: 'popular' }
  });
  
  if (cached.Item) {
    return cached.Item.programs;
  }
  
  // Fallback to PostgreSQL
  const programs = await this.programRepository.findPopular();
  
  // Cache in DynamoDB with TTL
  await docClient.put({
    TableName: 'mediamesh-discovery-hot-data',
    Item: {
      programId: 'popular',
      programs: programs,
      ttl: Math.floor(Date.now() / 1000) + 1800 // 30 minutes
    }
  });
  
  return programs;
}
```

### Search Service Integration

```typescript
// search-service/src/services/search.service.ts
async indexContent(contentId: string, content: any) {
  await docClient.put({
    TableName: 'mediamesh-search-index',
    Item: {
      contentId,
      contentType: content.type,
      title: content.title,
      description: content.description,
      category: content.category,
      indexedAt: new Date().toISOString()
    }
  });
}

async search(query: string) {
  // Use GSI for search
  const result = await docClient.query({
    TableName: 'mediamesh-search-index',
    IndexName: 'ContentTypeIndex',
    KeyConditionExpression: 'contentType = :type',
    FilterExpression: 'contains(title, :query) OR contains(description, :query)',
    ExpressionAttributeValues: {
      ':type': 'PROGRAM',
      ':query': query
    }
  });
  
  return result.Items;
}
```

---

## Networking & Security

### Application Load Balancer (ALB)

**Create ALB**:

```bash
aws elbv2 create-load-balancer \
  --name mediamesh-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx \
  --scheme internet-facing \
  --type application
```

**Create Target Groups**:

```bash
# Discovery Gateway Target Group
aws elbv2 create-target-group \
  --name discovery-gateway-tg \
  --protocol HTTP \
  --port 8080 \
  --vpc-id vpc-xxx \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# CMS Gateway Target Group
aws elbv2 create-target-group \
  --name cms-gateway-tg \
  --protocol HTTP \
  --port 8081 \
  --vpc-id vpc-xxx \
  --health-check-path /health
```

**Create Listeners**:

```bash
# HTTP Listener (redirect to HTTPS)
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}

# HTTPS Listener
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<acm-cert-arn> \
  --default-actions Type=forward,TargetGroupArn=<discovery-gateway-tg-arn>
```

### IAM Roles and Policies

**ECS Task Role** (for accessing AWS services):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:region:account:table/mediamesh-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": [
        "arn:aws:s3:::mediamesh-media-bucket/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:region:account:secret:mediamesh-*"
      ]
    }
  ]
}
```

---

## Monitoring & Logging

### CloudWatch Logs

**Create Log Groups**:

```bash
aws logs create-log-group --log-group-name /ecs/mediamesh
aws logs create-log-group --log-group-name /ecs/mediamesh/discovery-gateway
aws logs create-log-group --log-group-name /ecs/mediamesh/cms-gateway
# ... for each service
```

**View Logs**:

```bash
aws logs tail /ecs/mediamesh/discovery-gateway --follow
```

### CloudWatch Metrics and Alarms

**Create Alarms**:

```bash
# High CPU Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name mediamesh-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# High Error Rate Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name mediamesh-high-errors \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 60 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

---

## Cost Optimization

### RDS Optimization

- Use **Reserved Instances** for predictable workloads (up to 72% savings)
- Enable **Auto Scaling** for storage
- Use **gp3** storage (cheaper than io1)
- Schedule **stop/start** for non-production environments

### DynamoDB Optimization

- Use **On-Demand** billing for unpredictable traffic
- Use **Provisioned** capacity for predictable workloads
- Enable **Auto Scaling** for provisioned tables
- Use **TTL** to automatically delete expired items
- Use **GSI** efficiently (each GSI costs extra)

### ECS/EKS Optimization

- Use **Spot Instances** for non-critical workloads (up to 90% savings)
- Right-size containers (avoid over-provisioning)
- Use **Fargate Spot** for cost savings
- Implement **Auto Scaling** to scale down during low traffic

### S3 Optimization

- Use **S3 Intelligent-Tiering** for automatic cost optimization
- Set up **Lifecycle Policies** to move old data to Glacier
- Enable **S3 Transfer Acceleration** only when needed
- Use **CloudFront** to reduce S3 requests

---

## Deployment Checklist

- [ ] VPC and subnets created
- [ ] Security groups configured
- [ ] RDS instances created (all services)
- [ ] DynamoDB tables created
- [ ] ElastiCache Redis cluster created
- [ ] MSK cluster created
- [ ] S3 buckets created
- [ ] CloudFront distribution created
- [ ] ALB created and configured
- [ ] ECS cluster or EKS cluster created
- [ ] Services deployed
- [ ] Health checks passing
- [ ] CloudWatch monitoring configured
- [ ] Secrets stored in Secrets Manager
- [ ] IAM roles and policies configured
- [ ] SSL certificates configured
- [ ] Auto-scaling configured
- [ ] Backup policies configured

---

## Next Steps

1. Set up CI/CD pipeline (GitHub Actions, AWS CodePipeline)
2. Configure multi-region deployment (if needed)
3. Set up disaster recovery
4. Implement cost monitoring and budgets
5. Set up automated testing in staging environment

For more details, see:
- [Scalability Guide](../SCALABILITY_GUIDE.md)
- [DynamoDB Integration Guide](./DYNAMODB_INTEGRATION.md)
