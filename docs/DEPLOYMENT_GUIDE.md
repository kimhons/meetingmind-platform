# MeetingMind Platform Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the MeetingMind platform to production environments. The platform supports multiple deployment options with Railway being the recommended approach for its simplicity and scalability.

## Prerequisites

### System Requirements
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: Latest version
- **Railway CLI**: 4.x or higher (for Railway deployment)

### Required Services
- **Supabase**: PostgreSQL database with real-time features
- **Redis**: Caching and session storage (optional but recommended)
- **AWS S3**: File storage (optional)
- **AI Provider APIs**: At minimum AIMLAPI, optionally OpenAI, Anthropic, Google AI

## Deployment Options

### Option 1: Railway (Recommended)

Railway provides the simplest deployment experience with automatic scaling and built-in monitoring.

#### Step 1: Install Railway CLI
```bash
curl -fsSL https://railway.app/install.sh | sh
export PATH="$HOME/.railway/bin:$PATH"
```

#### Step 2: Login to Railway
```bash
railway login
```

#### Step 3: Configure Environment Variables
Create a `.env` file with your configuration:
```bash
cp .env.example .env
# Edit .env with your actual values
```

#### Step 4: Deploy
```bash
./deploy-staging.sh
```

### Option 2: Docker Deployment

For containerized deployments on any Docker-compatible platform.

#### Step 1: Build Docker Image
```bash
docker build -t meetingmind .
```

#### Step 2: Run Container
```bash
docker run -p 3000:3000 \
  --env-file .env \
  meetingmind
```

### Option 3: Manual Server Deployment

For traditional server deployments.

#### Step 1: Install Dependencies
```bash
# Frontend
cd frontend/web-app
npm ci
npm run build

# Backend
cd ../../backend
npm ci
```

#### Step 2: Start Application
```bash
npm start
```

## Environment Configuration

### Required Environment Variables

#### Database Configuration
```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### AI Provider Configuration
```bash
# Primary Provider (Required)
AIMLAPI_API_KEY=your_aimlapi_key

# Backup Providers (Recommended)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
```

#### Security Configuration
```bash
JWT_SECRET=your_jwt_secret_minimum_32_characters
ENCRYPTION_KEY=your_encryption_key_32_characters
SESSION_SECRET=your_session_secret_minimum_32_characters
```

### Optional Environment Variables

#### Redis Configuration
```bash
REDIS_URL=redis://localhost:6379
```

#### File Storage Configuration
```bash
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET=your_s3_bucket_name
```

#### Email Configuration
```bash
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

## Database Setup

### Supabase Configuration

1. **Create Supabase Project**
   - Visit [supabase.com](https://supabase.com)
   - Create new project
   - Note the project URL and API keys

2. **Run Database Migrations**
   ```bash
   cd database
   supabase db push
   ```

3. **Configure Row Level Security**
   ```bash
   supabase db reset
   ```

## AI Provider Setup

### AIMLAPI (Primary Provider)

1. **Sign up at [aimlapi.com](https://aimlapi.com)**
2. **Choose appropriate plan** (Pro recommended for production)
3. **Generate API key**
4. **Configure in environment variables**

### Backup Providers

#### OpenAI
1. Visit [platform.openai.com](https://platform.openai.com)
2. Create API key
3. Add billing information

#### Anthropic
1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Generate API key
3. Configure billing

#### Google AI
1. Visit [aistudio.google.com](https://aistudio.google.com)
2. Create API key
3. Enable billing if needed

## Security Configuration

### SSL/TLS Setup

For production deployments, ensure HTTPS is enabled:

#### Railway
- Automatic HTTPS with custom domains
- Built-in SSL certificate management

#### Manual Deployment
```bash
# Using Let's Encrypt with Certbot
sudo certbot --nginx -d yourdomain.com
```

### Firewall Configuration

Ensure only necessary ports are open:
- **Port 443**: HTTPS traffic
- **Port 80**: HTTP redirect to HTTPS
- **Port 22**: SSH (restrict to specific IPs)

### Environment Security

- Use strong, unique secrets for all keys
- Rotate API keys regularly
- Enable audit logging
- Monitor for unusual activity

## Monitoring and Logging

### Application Monitoring

The platform includes built-in monitoring endpoints:

- **Health Check**: `GET /api/health`
- **System Status**: `GET /api/status`
- **Metrics**: `GET /api/monitoring/metrics`

### Log Configuration

Configure structured logging:
```bash
LOG_LEVEL=info
LOG_FORMAT=json
```

### External Monitoring

Consider integrating with:
- **Datadog**: Application performance monitoring
- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: User session recording and debugging

## Performance Optimization

### Caching Strategy

1. **Redis Caching**
   - Session storage
   - API response caching
   - Real-time data caching

2. **CDN Configuration**
   - Static asset delivery
   - Global content distribution
   - Reduced latency

### Database Optimization

1. **Connection Pooling**
   ```bash
   DATABASE_POOL_SIZE=20
   DATABASE_TIMEOUT=30000
   ```

2. **Query Optimization**
   - Use database indexes
   - Optimize N+1 queries
   - Implement pagination

### AI Provider Optimization

1. **Request Batching**
   - Combine multiple requests
   - Reduce API call overhead

2. **Response Caching**
   - Cache frequent responses
   - Implement cache invalidation

## Scaling Configuration

### Horizontal Scaling

#### Railway
- Automatic scaling based on load
- Configure replica count in `railway.json`

#### Docker Swarm
```bash
docker service create \
  --replicas 3 \
  --name meetingmind \
  meetingmind:latest
```

#### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: meetingmind
spec:
  replicas: 3
  selector:
    matchLabels:
      app: meetingmind
  template:
    metadata:
      labels:
        app: meetingmind
    spec:
      containers:
      - name: meetingmind
        image: meetingmind:latest
        ports:
        - containerPort: 3000
```

### Vertical Scaling

Configure resource limits based on usage:
```bash
# Memory limits
MEMORY_LIMIT=2048
MAX_CONCURRENT_REQUESTS=1000

# CPU optimization
NODE_OPTIONS="--max-old-space-size=2048"
```

## Backup and Recovery

### Database Backups

#### Automated Backups
```bash
# Daily backup script
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
aws s3 cp backup_$(date +%Y%m%d).sql s3://your-backup-bucket/
```

#### Point-in-Time Recovery
- Supabase provides automatic backups
- Configure retention period
- Test recovery procedures

### Application Backups

1. **Code Repository**
   - Use Git for version control
   - Tag releases for easy rollback

2. **Configuration Backups**
   - Store environment configurations
   - Document deployment procedures

## Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check logs
railway logs
# or
docker logs container_name

# Verify environment variables
railway variables
```

#### 2. Database Connection Issues
```bash
# Test database connection
psql $SUPABASE_URL
```

#### 3. AI Provider Errors
```bash
# Test AI provider health
curl https://your-app-url/api/health/ai-providers
```

#### 4. High Memory Usage
```bash
# Monitor memory usage
railway metrics
# or
docker stats
```

### Performance Issues

#### 1. Slow Response Times
- Check AI provider latency
- Verify database query performance
- Monitor network connectivity

#### 2. High CPU Usage
- Review AI processing load
- Optimize database queries
- Consider horizontal scaling

## Maintenance

### Regular Maintenance Tasks

#### Weekly
- Review application logs
- Monitor performance metrics
- Check security alerts

#### Monthly
- Update dependencies
- Rotate API keys
- Review backup integrity
- Performance optimization review

#### Quarterly
- Security audit
- Disaster recovery testing
- Capacity planning review

### Update Procedures

#### Application Updates
```bash
# Pull latest code
git pull origin main

# Update dependencies
npm update

# Deploy update
./deploy-staging.sh
```

#### Security Updates
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Deploy security updates immediately
```

## Support and Documentation

### Internal Documentation
- **API Documentation**: `/docs/api/`
- **Architecture Guide**: `/docs/MEETINGMIND_ARCHITECTURE.md`
- **Configuration Guide**: `/docs/API_KEY_CONFIGURATION.md`

### External Resources
- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Node.js Best Practices**: [nodejs.org/en/docs/guides/](https://nodejs.org/en/docs/guides/)

### Emergency Contacts
- **Platform Issues**: Check application logs and monitoring dashboard
- **Database Issues**: Supabase support and documentation
- **AI Provider Issues**: Provider status pages and support channels

---

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] AI provider API keys tested
- [ ] Security configurations verified
- [ ] Monitoring and logging enabled
- [ ] Backup procedures tested
- [ ] Performance benchmarks established
- [ ] Documentation updated

**The MeetingMind platform is ready for production deployment with enterprise-grade reliability and performance.**
