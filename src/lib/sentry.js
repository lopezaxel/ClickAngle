import * as Sentry from '@sentry/browser';

const DSN = 'https://40bfe694628a6cda31b73d883c69240a@o4511350440001536.ingest.us.sentry.io/4511350457630720';

export function initSentry() {
    Sentry.init({
        dsn: DSN,
        environment: import.meta.env.MODE,
        sendDefaultPii: false,
        integrations: [
            Sentry.breadcrumbsIntegration({ console: false }),
        ],
        // Capture all errors in production, 10% in dev (to avoid noise during development)
        sampleRate: import.meta.env.PROD ? 1.0 : 0.1,
        beforeSend(event) {
            // Drop noisy network errors that are outside our control
            const msg = event.exception?.values?.[0]?.value || '';
            if (msg.includes('Load failed') || msg.includes('NetworkError')) return null;
            return event;
        },
    });
}

export function setSentryUser(user) {
    if (!user) {
        Sentry.setUser(null);
        return;
    }
    Sentry.setUser({ id: user.id, email: user.email, username: user.full_name });
}

export function captureError(err, context = {}) {
    Sentry.withScope(scope => {
        Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
        Sentry.captureException(err);
    });
}
