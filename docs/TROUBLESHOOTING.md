# Troubleshooting Guide

Comprehensive troubleshooting guide for MediaMesh deployment issues.

## Table of Contents

- [Service Startup Issues](#service-startup-issues)
- [Database Connection Issues](#database-connection-issues)
- [Redis Connection Issues](#redis-connection-issues)
- [Kafka Connection Issues](#kafka-connection-issues)
- [Network Issues](#network-issues)
- [Authentication Issues](#authentication-issues)
- [Performance Issues](#performance-issues)
- [Deployment Issues](#deployment-issues)

---

## Service Startup Issues

### Service Won't Start

**Symptoms:**
- Service exits immediately
- Container keeps restarting
- PM2 shows "errored" status

**Diagnosis:**
```bash
# Docker Compose
docker compose logs cms-service --tail=50

# PM2
pm2 logs cms-service --lines 50
pm2 show cms-service
```

**Common Causes:**

1. **Missing Environment Variables**
   ```bash
   # Check environment variables
   docker compose exec cms-service env | grep DATABASE_URL
   # or
   pm2 env cms-service
   ```

2. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :8002
   # Kill process or change port
   ```

3. **Missing Dependencies**
   ```bash
   # Verify infrastructure is running
   docker compose ps
   # or
   pm2 status
   ```

4. **Build Errors**
   ```bash
   # Rebuild service
   docker compose build cms-service
   # or
   npm run build
   ```

**Solutions:**
- Verify all required environment variables are set
- Check port availability
- Ensure dependencies (postgres, redis, kafka) are running
- Rebuild services if code changed

### Service Crashes Repeatedly

**Symptoms:**
- Service starts then crashes
- High restart count
- Memory errors

**Diagnosis:**
```bash
# Check restart count
docker compose ps
# or
pm2 list

# Check memory usage
docker stats
# or
pm2 monit
```

**Solutions:**
- Increase memory limit
- Check for memory leaks
- Review error logs
- Verify resource limits

---

## Database Connection Issues

### Connection Refused

**Symptoms:**
- "Connection refused" errors
- "ECONNREFUSED" in logs
- Service can't connect to database

**Diagnosis:**
```bash
# Verify PostgreSQL is running
docker compose ps postgres

# Test connection
docker compose exec postgres psql -U postgres -d cms_db

# Check DATABASE_URL
echo $DATABASE_URL
```

**Solutions:**

1. **Verify PostgreSQL is Running**
   ```bash
   docker compose up -d postgres
   docker compose ps postgres
   ```

2. **Check Connection String**
   ```bash
   # Development (Docker Compose)
   DATABASE_URL=postgresql://postgres:postgres@postgres:5432/cms_db?schema=public
   
   # Development (Local)
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cms_db?schema=public
   ```

3. **Verify Network Connectivity**
   ```bash
   docker compose exec cms-service ping postgres
   ```

4. **Check Database Exists**
   ```bash
   docker compose exec postgres psql -U postgres -c "\l"
   ```

### Authentication Failed

**Symptoms:**
- "Authentication failed" errors
- "Password authentication failed"

**Solutions:**
- Verify database credentials in environment variables
- Check `DB_USERNAME` and `DB_PASSWORD`
- Ensure user has proper permissions

### Database Does Not Exist

**Symptoms:**
- "Database does not exist" errors
- "FATAL: database 'cms_db' does not exist"

**Solutions:**
```bash
# Create database
docker compose exec postgres psql -U postgres -c "CREATE DATABASE cms_db;"

# Or use init script
docker compose up -d postgres
# Wait for init script to run
```

### Migration Issues

**Symptoms:**
- "Migration failed" errors
- Schema out of sync

**Solutions:**
```bash
# Run migrations
cd services/cms-service
npm run prisma:migrate:deploy

# Or reset database
npm run prisma:migrate:reset
```

---

## Redis Connection Issues

### Connection Refused

**Symptoms:**
- "Connection refused" to Redis
- Rate limiting not working
- Cache not functioning

**Diagnosis:**
```bash
# Verify Redis is running
docker compose ps redis

# Test connection
docker compose exec redis redis-cli ping
```

**Solutions:**

1. **Verify Redis is Running**
   ```bash
   docker compose up -d redis
   ```

2. **Check Redis Configuration**
   ```bash
   echo $REDIS_HOST
   echo $REDIS_PORT
   ```

3. **Test Connection**
   ```bash
   docker compose exec cms-service sh
   redis-cli -h redis -p 6379 ping
   ```

### Authentication Failed

**Symptoms:**
- "NOAUTH Authentication required"
- "Invalid password"

**Solutions:**
- Verify `REDIS_PASSWORD` matches Redis configuration
- Check if Redis requires password
- Update environment variables

---

## Kafka Connection Issues

### Broker Not Available

**Symptoms:**
- "Broker not available" errors
- Events not being published
- Consumer not receiving messages

**Diagnosis:**
```bash
# Verify Kafka is running
docker compose ps broker

# Check Kafka logs
docker compose logs broker

# Test connection
docker compose exec broker kafka-broker-api-versions --bootstrap-server localhost:9092
```

**Solutions:**

1. **Verify Kafka is Running**
   ```bash
   docker compose up -d broker
   # Wait for Kafka to start (60s)
   ```

2. **Check Broker Address**
   ```bash
   # Docker Compose
   KAFKA_BROKER=broker:29092
   
   # Local
   KAFKA_BROKER=localhost:9092
   ```

3. **Verify Topics Exist**
   ```bash
   docker compose exec broker kafka-topics --list --bootstrap-server localhost:9092
   ```

4. **Check Consumer Groups**
   ```bash
   docker compose exec broker kafka-consumer-groups --bootstrap-server localhost:9092 --list
   ```

### Consumer Lag

**Symptoms:**
- High consumer lag
- Messages not being processed

**Solutions:**
- Scale consumers
- Check consumer group configuration
- Verify consumer is running
- Check for processing errors

---

## Network Issues

### Services Can't Communicate

**Symptoms:**
- "Connection refused" between services
- Timeout errors
- Services can't reach each other

**Diagnosis:**
```bash
# Test connectivity
docker compose exec cms-service ping metadata-service

# Check DNS resolution
docker compose exec cms-service nslookup metadata-service

# Verify network
docker network inspect mediamesh-network
```

**Solutions:**

1. **Verify Services on Same Network**
   ```bash
   # All services should be on mediamesh-network
   docker network inspect mediamesh-network
   ```

2. **Check Service Names**
   - Use service names, not IP addresses
   - Example: `http://cms-service:8002`

3. **Verify Ports**
   - Check service ports match configuration
   - Ensure ports are exposed correctly

### Port Conflicts

**Symptoms:**
- "Address already in use" errors
- Service fails to bind to port

**Solutions:**
```bash
# Find process using port
lsof -i :8002

# Kill process
kill -9 <PID>

# Or change port
PORT=8006 pm2 start ecosystem.config.js --only cms-service
```

---

## Authentication Issues

### JWT Token Invalid

**Symptoms:**
- "Invalid token" errors
- "Unauthorized" responses
- Token validation fails

**Solutions:**
- Verify `JWT_SECRET` matches between services
- Check token expiration
- Ensure token is properly formatted
- Verify token is sent in Authorization header

### Token Expired

**Symptoms:**
- "Token expired" errors
- Authentication fails after time period

**Solutions:**
- Check `JWT_EXPIRATION` setting
- Refresh token or login again
- Verify system clock is synchronized

### Role Authorization Fails

**Symptoms:**
- "Forbidden" errors
- User can't access resource

**Solutions:**
- Verify user role in token
- Check `@Roles()` decorator configuration
- Ensure role matches required permission

---

## Performance Issues

### High Memory Usage

**Symptoms:**
- Service crashes with OOM errors
- High memory consumption
- Frequent restarts

**Solutions:**
- Increase memory limits
- Check for memory leaks
- Optimize code
- Use memory profiling tools

### Slow Response Times

**Symptoms:**
- High latency
- Timeout errors
- Slow API responses

**Diagnosis:**
```bash
# Check response times
curl -w "@curl-format.txt" http://localhost:8080/api/v1/discovery/programs

# Monitor resources
docker stats
pm2 monit
```

**Solutions:**
- Enable Redis caching
- Optimize database queries
- Add indexes
- Scale services horizontally
- Use CDN for static assets

### Database Performance

**Symptoms:**
- Slow queries
- High database load
- Connection pool exhaustion

**Solutions:**
- Add database indexes
- Optimize queries
- Use connection pooling
- Add read replicas
- Enable query caching

---

## Deployment Issues

### Docker Build Fails

**Symptoms:**
- Build errors
- Image not created
- Dependency errors

**Solutions:**
```bash
# Clean build
docker compose build --no-cache

# Check build logs
docker compose build cms-service 2>&1 | tee build.log

# Verify Dockerfile
docker build -f services/cms-service/Dockerfile -t test .
```

### PM2 Process Issues

**Symptoms:**
- Processes not starting
- Processes crashing
- Environment variables not loaded

**Solutions:**
```bash
# Check PM2 logs
pm2 logs --err

# Verify environment
pm2 env cms-service

# Restart with fresh environment
pm2 delete all
export $(cat .env.development | xargs)
pm2 start ecosystem.config.js
```

### Migration Failures

**Symptoms:**
- Database migrations fail
- Schema out of sync
- Migration errors

**Solutions:**
```bash
# Check migration status
cd services/cms-service
npx prisma migrate status

# Run migrations
npm run prisma:migrate:deploy

# Reset if needed (careful!)
npm run prisma:migrate:reset
```

---

## Debugging Commands

### Docker Compose

```bash
# Execute command in container
docker compose exec cms-service sh

# View environment variables
docker compose exec cms-service env

# Check network connectivity
docker compose exec cms-service ping postgres

# View container logs
docker compose logs -f --tail=100 cms-service

# Inspect container
docker compose exec cms-service ps aux
```

### PM2

```bash
# View detailed service info
pm2 show cms-service

# View environment variables
pm2 env cms-service

# Reset restart counter
pm2 reset cms-service

# Flush logs
pm2 flush

# Reload service
pm2 reload cms-service
```

### Database

```bash
# Connect to database
docker compose exec postgres psql -U postgres -d cms_db

# List databases
docker compose exec postgres psql -U postgres -c "\l"

# List tables
docker compose exec postgres psql -U postgres -d cms_db -c "\dt"

# Check connections
docker compose exec postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"
```

### Redis

```bash
# Connect to Redis
docker compose exec redis redis-cli

# Test connection
docker compose exec redis redis-cli ping

# Check keys
docker compose exec redis redis-cli KEYS "*"

# Monitor commands
docker compose exec redis redis-cli MONITOR
```

### Kafka

```bash
# List topics
docker compose exec broker kafka-topics --list --bootstrap-server localhost:9092

# Describe topic
docker compose exec broker kafka-topics --describe --topic content.created --bootstrap-server localhost:9092

# List consumer groups
docker compose exec broker kafka-consumer-groups --bootstrap-server localhost:9092 --list

# Check consumer lag
docker compose exec broker kafka-consumer-groups --bootstrap-server localhost:9092 --describe --group search-service-group
```

---

## Getting Help

1. **Check Logs First**
   - Service logs
   - Infrastructure logs
   - Error messages

2. **Verify Configuration**
   - Environment variables
   - Service ports
   - Network configuration

3. **Test Dependencies**
   - Database connectivity
   - Redis connectivity
   - Kafka connectivity

4. **Review Documentation**
   - [Deployment Guide](./DEPLOYMENT.md)
   - [Environment Configuration](./ENV_CONFIGURATION.md)
   - [Health Checks](./HEALTH_CHECKS.md)

5. **Common Solutions**
   - Restart services
   - Rebuild images
   - Check environment variables
   - Verify dependencies are running

---

## Quick Reference

### Service Status
```bash
# Docker Compose
docker compose ps

# PM2
pm2 status
```

### View Logs
```bash
# Docker Compose
docker compose logs -f cms-service

# PM2
pm2 logs cms-service
```

### Restart Service
```bash
# Docker Compose
docker compose restart cms-service

# PM2
pm2 restart cms-service
```

### Health Check
```bash
curl http://localhost:8002/health
```

### Test Connectivity
```bash
# Database
docker compose exec cms-service ping postgres

# Redis
docker compose exec redis redis-cli ping

# Kafka
docker compose exec broker kafka-broker-api-versions --bootstrap-server localhost:9092
```
