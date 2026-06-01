// worker/services/sms.ts
// SMS provider abstraction (Sprint 2 Task 1 — AUTH-BE-06).
// One interface, swappable backends. Dev mode logs the code instead of sending.
// Wire a real provider by setting SMS_PROVIDER + credentials in wrangler secrets.

import type { Env } from '../index';

export interface SmsProvider {
  readonly name: string;
  sendOtp(phoneE164: string, code: string): Promise<{ ok: boolean; error?: string }>;
}

/** Dev/test provider: never sends a real SMS; logs so the code is visible in `wrangler tail`. */
class ConsoleSmsProvider implements SmsProvider {
  readonly name = 'console';
  async sendOtp(phoneE164: string, code: string) {
    console.log(`[sms:console] OTP for ${phoneE164} = ${code}`);
    return { ok: true };
  }
}

/** MSG91 (India-first). Requires MSG91_AUTH_KEY (+ optional MSG91_TEMPLATE_ID, MSG91_SENDER). */
class Msg91SmsProvider implements SmsProvider {
  readonly name = 'msg91';
  constructor(private authKey: string, private templateId?: string, private sender?: string) {}

  async sendOtp(phoneE164: string, code: string) {
    const mobile = phoneE164.replace(/^\+/, ''); // MSG91 wants country code without '+'
    try {
      const res = await fetch('https://control.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authkey: this.authKey },
        body: JSON.stringify({
          mobile,
          otp: code,
          ...(this.templateId ? { template_id: this.templateId } : {}),
          ...(this.sender ? { sender: this.sender } : {})
        })
      });
      if (!res.ok) return { ok: false, error: `msg91_http_${res.status}` };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'msg91_failed' };
    }
  }
}

/** Twilio Verify / Programmable SMS. Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM. */
class TwilioSmsProvider implements SmsProvider {
  readonly name = 'twilio';
  constructor(private sid: string, private token: string, private from: string) {}

  async sendOtp(phoneE164: string, code: string) {
    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.sid}/Messages.json`, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          authorization: `Basic ${btoa(`${this.sid}:${this.token}`)}`
        },
        body: new URLSearchParams({
          To: phoneE164,
          From: this.from,
          Body: `Your Instadate verification code is ${code}. It expires in 5 minutes.`
        })
      });
      if (!res.ok) return { ok: false, error: `twilio_http_${res.status}` };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'twilio_failed' };
    }
  }
}

/** Select the provider from env. Falls back to console (dev) when unconfigured. */
export function getSmsProvider(env: Env): SmsProvider {
  switch ((env.SMS_PROVIDER || '').toLowerCase()) {
    case 'msg91':
      if (env.MSG91_AUTH_KEY) return new Msg91SmsProvider(env.MSG91_AUTH_KEY, env.MSG91_TEMPLATE_ID, env.MSG91_SENDER);
      break;
    case 'twilio':
      if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM) {
        return new TwilioSmsProvider(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN, env.TWILIO_FROM);
      }
      break;
  }
  return new ConsoleSmsProvider();
}
