import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV:             z.enum(['development', 'production', 'test']).default('development'),
  PORT:                 z.coerce.number().default(3000),

  // Database
  DATABASE_URL:         z.string().url(),
  REDIS_URL:            z.string().url(),

  // Auth
  JWT_ACCESS_SECRET:    z.string().min(32),
  JWT_REFRESH_SECRET:   z.string().min(32),
  JWT_ACCESS_EXPIRES:   z.string().default('15m'),
  JWT_REFRESH_EXPIRES:  z.string().default('30d'),
  COOKIE_SECRET:        z.string().min(32),

  // Razorpay
  RAZORPAY_KEY_ID:      z.string(),
  RAZORPAY_KEY_SECRET:  z.string(),
  RAZORPAY_WEBHOOK_SECRET: z.string(),

  // MSG91 (OTP + SMS)
  MSG91_AUTH_KEY:       z.string(),
  MSG91_SENDER_ID:      z.string().default('CMPLWL'),
  MSG91_OTP_TEMPLATE_ID: z.string(),

  // WhatsApp (Interakt)
  INTERAKT_API_KEY:     z.string(),
  INTERAKT_WA_TEMPLATE_7D:  z.string(),
  INTERAKT_WA_TEMPLATE_3D:  z.string(),
  INTERAKT_WA_TEMPLATE_DUE: z.string(),
  INTERAKT_WA_TEMPLATE_EXT: z.string(),

  // Sentry
  SENTRY_DSN:           z.string().optional(),

  // App
  FRONTEND_URL:         z.string().default('http://localhost:3000,http://localhost:8080'),
  ENCRYPTION_KEY:       z.string().length(64), // 32-byte hex = 64 chars

  // Crypto for OTP
  OTP_EXPIRY_MINUTES:   z.coerce.number().default(10),
  OTP_MAX_ATTEMPTS:     z.coerce.number().default(5),
});

export type Env = z.infer<typeof envSchema>;

export function envValidation(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    result.error.issues.forEach((issue) => {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }
  return result.data;
}
