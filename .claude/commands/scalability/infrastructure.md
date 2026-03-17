# Infrastructure Scaling Reference

## Kubernetes Autoscaling (HPA)

### Configuration
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

### Resource Requests & Limits
```yaml
resources:
  requests:
    cpu: 250m
    memory: 512Mi
  limits:
    cpu: 500m
    memory: 1Gi
```

**Rules:**
- HPA measures % of **request**, not limit
- `minReplicas: 2+` in production (single pod = downtime during restart)
- Target utilization 50-70% gives spike headroom

---

## Serverless Patterns

### Cold Start Optimization
```typescript
let dbClient: PrismaClient | null = null;

export const handler = async (event: any) => {
  if (!dbClient) {
    const { PrismaClient } = await import('@prisma/client');
    dbClient = new PrismaClient();
  }
  return dbClient.user.findMany();
};
```

**Cold start costs by memory:**
| Memory | Cold Start | Cost/invocation |
|--------|-----------|----------------|
| 256MB | ~400ms | $0.0000004 |
| 512MB | ~280ms | $0.0000008 |
| 1024MB | ~150ms | $0.0000017 |

**Rule:** Allocate 1.5x typical memory usage — faster execution + faster cold starts.

---

## CDN Caching

### Cache-Control Headers
```typescript
// Static assets (versioned URLs — cache forever)
res.set('Cache-Control', 'public, max-age=31536000, immutable');

// API responses (cache at edge, short client cache)
res.set('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=60');

// Private/authenticated content
res.set('Cache-Control', 'private, max-age=300');

// Never cache
res.set('Cache-Control', 'no-store');
```

### Cache Busting via Content Hashing
```javascript
output: { filename: '[name].[contenthash].js' }
// Combine with: Cache-Control: public, max-age=31536000, immutable
```

---

## Deployments

### Blue-Green (Zero Downtime, Instant Rollback)
```
1. Deploy v2 alongside v1 (both running)
2. Test v2 thoroughly
3. Switch load balancer: v1 → v2
4. Keep v1 for 1 hour (instant rollback)
5. Decommission v1
```

### Canary (Gradual, Lower Risk)
```yaml
analysis:
  interval: 1m
  threshold: 5
  maxWeight: 50
  stepWeight: 10
  metrics:
  - name: request-success-rate
    thresholdRange: { min: 99 }
  - name: request-duration
    thresholdRange: { max: 500 }
```

### Database Migrations in Deployments
```sql
-- SAFE: Backward compatible
ALTER TABLE users ADD COLUMN new_field TEXT DEFAULT '';

-- UNSAFE: Breaks old version
ALTER TABLE users DROP COLUMN old_field;
```

**Rule:** Always deploy in 3 phases:
1. Add new column (backward compatible)
2. Deploy new code that uses new column
3. Remove old column (after old code is gone)

---

## Observability

### The Four Golden Signals
| Signal | What to Measure | Alert When |
|--------|----------------|------------|
| **Latency** | p50, p95, p99 response time | p99 > 500ms |
| **Traffic** | Requests per second | Unusual spike or drop |
| **Errors** | Error rate (5xx / total) | > 1% error rate |
| **Saturation** | CPU, memory, DB connections, queue depth | > 80% utilization |

### Structured Logging
```typescript
import pino from 'pino';
const logger = pino({ level: 'info' });

logger.info({ userId: '123', action: 'login', duration: 45 }, 'User logged in');
```

### Key Metrics to Track
```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
});

app.use((req, res, next) => {
  const end = httpDuration.startTimer({ method: req.method, route: req.route?.path });
  res.on('finish', () => end({ status: res.statusCode }));
  next();
});
```

---

## Concurrency Patterns

### Semaphore (Limit Concurrent Operations)
```typescript
class Semaphore {
  private queue: (() => void)[] = [];
  private running = 0;

  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.max) { this.running++; return; }
    return new Promise(resolve => this.queue.push(resolve));
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) { this.running++; next(); }
  }
}

const sem = new Semaphore(10);
async function queryWithLimit(sql: string) {
  await sem.acquire();
  try { return await db.query(sql); }
  finally { sem.release(); }
}
```

---

## Load Testing

### Before Optimizing, Profile
```bash
k6 run --vus 50 --duration 30s script.js
npx artillery quick --count 50 --num 100 http://localhost:3000/api/users
```

### What to Measure During Load Tests

| Metric | Tool | Warning Sign |
|--------|------|-------------|
| p99 latency | k6, Artillery | > 500ms |
| Throughput | k6 | Plateaus while CPU < 100% (IO bottleneck) |
| Error rate | k6 | > 0 (should be zero under expected load) |
| DB connections | pg_stat_activity | Near max_connections |
| Memory | top/htop | Continuously growing (leak) |

**Rule:** Test at 2x expected peak traffic.
