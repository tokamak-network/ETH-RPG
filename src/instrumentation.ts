// Next.js instrumentation — Sentry init + environment variable validation

const REQUIRED_ENV_VARS = [
  'ALCHEMY_API_KEY',
  'ANTHROPIC_API_KEY',
  'NEXT_PUBLIC_SITE_URL',
] as const;

function validateEnvironment(): void {
  const missingRequired = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);

  if (missingRequired.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(
      `[instrumentation] Missing required env vars: ${missingRequired.join(', ')}`,
    );
  }
}

export async function register(): Promise<void> {
  validateEnvironment();

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export async function onRequestError(
  error: { digest: string } & Error,
  request: {
    path: string;
    method: string;
    headers: Record<string, string>;
  },
  context: {
    routerKind: string;
    routePath: string;
    routeType: string;
    renderSource: string;
    revalidateReason: string | undefined;
    renderType: string;
  },
): Promise<void> {
  try {
    const Sentry = await import('@sentry/nextjs');
    Sentry.captureRequestError(error, request, context);
  } catch {
    // Sentry not available — silently ignore
  }
}
