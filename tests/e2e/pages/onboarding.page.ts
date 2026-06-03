import { expect, type Locator, type Page } from '@playwright/test';

// Page Object for the 13-screen onboarding machine (src/OnboardingFlow.jsx).
//
// The flow is a single `index` state 0..12 rendered into one shell. There is
// exactly ONE primary advance button at the bottom:
//   • index 0..11 → label "Continue"
//   • index 12    → label "Enter Instadate" (final; calls onComplete → /profile feed)
// (The per-slide `primary` strings like "Start the club pass" are decorative
// metadata, NOT the button text — the button is always Continue/Enter Instadate.)
//
// Steps and their mandatory gates (validationGate in OnboardingFlow.jsx):
//   0  Hero (info)                       1  Timeline (info)      2  Trust (info)
//   3  Auth gate        → must be authenticated
//   4  Phone OTP        → draft.phone set AND profile.phone_verified === 1
//   5  Basics           → fullName, age ≥ 18, gender
//   6  Photos           → ≥ 1 uploaded photo (file input)
//   7  Bio (skippable)
//   8  Intent           → intent selected (Dating/Friendship/Networking)
//   9  Interests (skippable)
//   10 City             → city text
//   11 Notifications permission (skippable: "Skip for now")
//   12 Ready            → "Enter Instadate" finishes
export class OnboardingPage {
  readonly page: Page;
  readonly primaryButton: Locator;
  readonly backButton: Locator;
  readonly errorText: Locator;

  constructor(page: Page) {
    this.page = page;
    // The bottom advance button. Its accessible name is "Continue" then the
    // final-step "Enter Instadate"; an ArrowRight/Crown icon sits inside it.
    this.primaryButton = page.getByRole('button', { name: /^(Continue|Enter Instadate|Creating Pass)/ });
    this.backButton = page.getByRole('button', { name: 'Back' });
    // The single error line in the bottom action bar (pink validation hints).
    this.errorText = page.locator('p.text-\\[\\#ff8aa8\\]');
  }

  /** Navigate to /onboarding with guest mode disabled (so the route renders). */
  async open(): Promise<void> {
    await this.page.goto('/onboarding');
    await expect(this.primaryButton).toBeVisible();
  }

  /** Click the single primary advance button. */
  async clickPrimary(): Promise<void> {
    await this.primaryButton.click();
  }

  /** Assert the visible step header eyebrow (e.g. "Step 6 of 12: Basics"). */
  async expectEyebrow(text: string | RegExp): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }

  /** Step 5: name + age + gender. */
  async fillBasics(fullName: string, age: string, gender: 'Female' | 'Male' | 'Non-binary'): Promise<void> {
    await this.page.getByPlaceholder('Priyanka Sen').fill(fullName);
    await this.page.getByPlaceholder('23').fill(age);
    await this.page.getByRole('button', { name: gender, exact: true }).click();
  }

  /** Step 6: set the (hidden) file input with a tiny in-memory PNG. */
  async uploadPhoto(): Promise<void> {
    // 1×1 transparent PNG — the same fixture the API helper uses.
    const pngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(pngBase64, 'base64');
    const input = this.page.locator('input[type="file"]').first();
    await input.setInputFiles({ name: 'onboarding.png', mimeType: 'image/png', buffer });
    // Wait for the upload to land: a thumbnail <img> replaces an empty slot.
    await expect(this.page.locator('img[alt=""]')).toHaveCount(1, { timeout: 15_000 });
  }

  /** Step 8: pick the dating intention (mandatory). */
  async selectIntent(intent: 'Dating' | 'Friendship' | 'Networking'): Promise<void> {
    await this.page.getByRole('button', { name: intent, exact: true }).click();
  }

  /** Step 10: enter the city (mandatory). */
  async fillCity(city: string): Promise<void> {
    await this.page.getByPlaceholder('Mumbai, Bangalore, Delhi NCR...').fill(city);
  }

  /** Step 11: skip the notifications permission prompt (headless-safe).
   * NOTE: index 11 is also a "skippable" step, so the fixed bottom action bar ALSO
   * renders a "Skip for now" button. We target the step's own skip button — the one
   * inside the scrolling content <section>, paired with "Enable Notifications" — not
   * the footer one, to avoid a strict-mode ambiguity. */
  async skipNotifications(): Promise<void> {
    await this.page.locator('section').getByRole('button', { name: 'Skip for now' }).click();
  }
}
