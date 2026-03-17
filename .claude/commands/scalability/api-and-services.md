# API Design & Service Resilience Reference

## Pagination

### Cursor-Based (Recommended for Scale)
```typescript
app.get('/posts', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const cursor = req.query.cursor;

  const posts = await prisma.post.findMany({
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { id: 'asc' }
  });

  const hasMore = posts.length > limit;
  const data = hasMore ? posts.slice(0, -1) : posts;

  res.json({
    data,
    pagination: {
      hasMore,
      nextCursor: hasMore ? data[data.length - 1].id : null
    }
  });
});
```

### Offset-Based (Simple, Limited Scale)
```typescript
app.get('/posts', async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  if (offset > 10000) return res.status(400).json({ error: 'Use cursor pagination for deep pages' });

  const [data, total] = await Promise.all([
    prisma.post.findMany({ skip: offset, take: limit, orderBy: { id: 'asc' } }),
    prisma.post.count()
  ]);

  res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});
```

**Rule:** Use cursor for APIs consumed by infinite scroll or programmatic clients. Use offset only for admin UIs where page numbers matter and data is small.

---

## Rate Limiting

### Tiered Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
}));

app.use('/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
}));

app.use('/api/v1/', rateLimit({
  windowMs: 60 * 1000,
  max: (req) => {
    if (req.user?.tier === 'enterprise') return 5000;
    if (req.user?.tier === 'pro') return 1000;
    return 100;
  }
}));
```

---

## Circuit Breaker

### Implementation (Opossum)
```typescript
import CircuitBreaker from 'opossum';

const paymentBreaker = new CircuitBreaker(
  async (userId: string, amount: number) => {
    return await paymentService.charge(userId, amount);
  },
  {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    volumeThreshold: 10
  }
);

paymentBreaker.fallback(() => ({ status: 'degraded', message: 'Payments temporarily unavailable' }));

paymentBreaker.on('open', () => logger.error('Payment circuit OPEN'));
paymentBreaker.on('halfOpen', () => logger.warn('Payment circuit testing...'));
paymentBreaker.on('close', () => logger.info('Payment circuit recovered'));
```

### Circuit Breaker States
```
CLOSED ──(failures > threshold)──→ OPEN ──(resetTimeout)──→ HALF-OPEN
  ↑                                                             │
  └───────────(success)────────────────────────────────────────┘
  └──────────────────────────────(failure)──→ OPEN
```

### Configuration Guidelines
- `timeout`: Set to p99 latency + 20% buffer
- `errorThresholdPercentage`: 50% for aggressive, 25% for conservative
- `resetTimeout`: 30-60s (match service recovery time)
- `volumeThreshold`: 10-20 (avoid opening on 1 failure)

---

## Graceful Shutdown

```typescript
const server = http.createServer(app);
let shuttingDown = false;

process.on('SIGTERM', async () => {
  shuttingDown = true;
  server.close(async () => {
    await Promise.allSettled([
      prisma.$disconnect(),
      redis.quit(),
      worker.close()
    ]);
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
});

app.use((req, res, next) => {
  if (shuttingDown) return res.status(503).json({ error: 'Shutting down' });
  next();
});
```

---

## Stateless Design

### Session Externalization
```typescript
import session from 'express-session';
import RedisStore from 'connect-redis';

app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, httpOnly: true, maxAge: 3600000 }
}));
```

### Stateless Auth (JWT)
```typescript
const token = jwt.sign({ sub: userId, role: 'user' }, secret, { expiresIn: '15m' });
const user = jwt.verify(token, secret);
```

**JWT vs Redis Sessions:**
| Factor | JWT | Redis Sessions |
|--------|-----|----------------|
| Revocation | Hard (wait for expiry) | Instant (delete key) |
| Scalability | Excellent (no state) | Good (Redis cluster) |
| Token size | Large (payload in token) | Small (session ID only) |
| Server load | None | Redis lookup per request |

**Rule:** Use JWT for stateless APIs and microservices. Use Redis sessions when you need instant revocation.

---

## API Response Optimization

### Compression
```typescript
import compression from 'compression';
app.use(compression({ threshold: 1024, level: 6 }));
```

### Batch Endpoints
```typescript
app.post('/users/batch', async (req, res) => {
  const ids = req.body.ids;
  if (!Array.isArray(ids) || ids.length > 100) {
    return res.status(400).json({ error: 'Max 100 IDs per batch' });
  }
  const users = await prisma.user.findMany({ where: { id: { in: ids } } });
  res.json({ data: users });
});
```
