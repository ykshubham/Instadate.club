import { type Page, type Locator, expect } from '@playwright/test';

// Page Object for the LoginPage component (src/main.jsx ~L471).
// Stages: 'phone' (default) → 'code' (after Send code) and 'email' → 'emailSent'.
//
// Guest mode is ON by default and the route guard redirects /login → /, so every
// flow disables it via an init script BEFORE navigating (see `goto`).
export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // --- locators -------------------------------------------------------------
  get countryCode(): Locator {
    return this.page.locator('select.login-input');
  }
  get phoneInput(): Locator {
    return this.page.getByPlaceholder('Phone number');
  }
  get sendCodeButton(): Locator {
    return this.page.getByRole('button', { name: 'Send code' });
  }
  get codeInput(): Locator {
    return this.page.getByPlaceholder('6-digit code');
  }
  get verifyButton(): Locator {
    return this.page.getByRole('button', { name: 'Verify & sign in' });
  }
  get switchToEmailButton(): Locator {
    return this.page.getByRole('button', { name: 'Sign in with Email Magic Link' });
  }
  get emailInput(): Locator {
    return this.page.getByPlaceholder('Enter your email');
  }
  get sendMagicLinkButton(): Locator {
    return this.page.getByRole('button', { name: 'Send Magic Link' });
  }
  get heading(): Locator {
    return this.page.getByRole('heading', { name: /sign in to instadate/i });
  }
  /** The cyan info line that renders the dev OTP code or magic-link status. */
  get devCodeInfo(): Locator {
    return this.page.getByText(/Dev code:/);
  }

  // --- actions --------------------------------------------------------------

  /** Disable guest mode (so /login isn't redirected to /) then open the page. */
  async goto(): Promise<void> {
    await this.page.addInitScript(() =>
      sessionStorage.setItem('instadate_guest_mode', 'false')
    );
    await this.page.goto('/login');
    await expect(this.heading).toBeVisible();
  }

  /** Pick a country code only when the <select> is actually present. */
  async selectCountryCode(code: string): Promise<void> {
    if (await this.countryCode.count()) {
      await this.countryCode.selectOption(code);
    }
  }

  async fillPhone(phone: string): Promise<void> {
    await this.phoneInput.fill(phone);
  }

  async sendCode(): Promise<void> {
    await this.sendCodeButton.click();
  }

  /** Read the 6-digit dev code surfaced in the info line after sending. */
  async readDevCode(): Promise<string> {
    await expect(this.devCodeInfo).toBeVisible();
    const text = (await this.devCodeInfo.textContent()) ?? '';
    const match = /Dev code:\s*(\d{6})/.exec(text);
    if (!match) throw new Error(`Could not parse dev code from info text: "${text}"`);
    return match[1];
  }

  async enterCode(code: string): Promise<void> {
    await this.codeInput.fill(code);
  }

  async verify(): Promise<void> {
    await this.verifyButton.click();
  }
}
