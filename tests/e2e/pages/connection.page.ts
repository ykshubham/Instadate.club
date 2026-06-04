import { expect, type Page } from '@playwright/test';

// Page Object for the CONNECTION flow.
//   • Members discovery (/members): member cards → MemberProfileModal → VibeRequestModal.
//   • Connection requests inbox (/requests): ConnectionRequestsPage (Accept / Decline).
//
// Selectors are derived from src/main.jsx:
//   - MemberCard (~2534): the whole <article class="member-card"> is the click target
//     (role="button"); clicking it calls onProfileClick → opens MemberProfileModal.
//   - MemberProfileModal (~2748): primary action button reads "Send Vibe Check"
//     (".member-profile-modal" backdrop); clicking it calls onVibeClick → VibeRequestModal.
//   - VibeRequestModal (~5164): note <textarea> + primary button "Send Vibe Check"
//     inside ".vibe-sheet"; on send the app fires notify('Connection request sent to …')
//     which renders as <div class="app-toast">…</div>.
//   - ConnectionRequestsPage (~3071): one ".inbox-card" per incoming request with
//     "Accept" / "Decline" buttons; the sender name is a <strong>.
export class ConnectionPage {
  constructor(private readonly page: Page) {}

  // ---- Discovery / send-request ----

  async gotoMembers(): Promise<void> {
    await this.page.goto('/members');
    // Members render once /api/members resolves; wait for at least one card.
    await expect(this.firstMemberCard()).toBeVisible();
  }

  firstMemberCard() {
    return this.page.locator('article.member-card').first();
  }

  /** The discovery card whose visible text contains `name`. */
  memberCardByName(name: string | RegExp) {
    return this.page
      .locator('article.member-card')
      .filter({ has: this.page.getByText(name) });
  }

  /** Open a member's profile modal by clicking the first discovery card. */
  async openFirstMemberProfile() {
    await this.firstMemberCard().click();
    const modal = this.page.locator('.member-profile-modal');
    await expect(modal).toBeVisible();
    return modal;
  }

  /** Open a specific member's profile modal by name (scrolls it into view first). */
  async openMemberProfileByName(name: string | RegExp) {
    const card = this.memberCardByName(name);
    await card.scrollIntoViewIfNeeded();
    await card.click();
    const modal = this.page.locator('.member-profile-modal');
    await expect(modal).toBeVisible();
    return modal;
  }

  /** From the open MemberProfileModal, click "Send Vibe Check" to reveal VibeRequestModal. */
  async openVibeRequestModalFromProfile() {
    await this.page
      .locator('.member-profile-modal')
      .getByRole('button', { name: /send vibe check|vibe sent/i })
      .click();
    const sheet = this.page.locator('.vibe-sheet');
    await expect(sheet).toBeVisible();
    return sheet;
  }

  vibeNoteField() {
    return this.page.locator('.vibe-sheet textarea');
  }

  /** Fill the intro note (if present) and click the modal's send button. */
  async sendVibeRequest(note?: string): Promise<void> {
    if (note) {
      const field = this.vibeNoteField();
      if (await field.count()) await field.fill(note);
    }
    await this.page
      .locator('.vibe-sheet')
      .getByRole('button', { name: /send vibe check/i })
      .click();
  }

  async recordAndSendVoiceNote(): Promise<void> {
    await this.page.getByRole('button', { name: /record voice note/i }).click();
    await this.page.waitForTimeout(1500);
    await this.page.getByRole('button', { name: /stop/i }).click();
    await this.page.getByRole('button', { name: /send vibe check/i }).click();
    await this.page.waitForURL('**/members');
  }

  toast() {
    return this.page.locator('.app-toast');
  }

  vibeSheet() {
    return this.page.locator('.vibe-sheet');
  }

  /** The vibe sheet's primary button after sending flips to "Already Sent" (disabled). */
  vibeAlreadySentButton() {
    return this.vibeSheet().getByRole('button', { name: /send vibe check/i });
  }

  // ---- Requests inbox / accept ----

  async gotoRequests(): Promise<void> {
    await this.page.goto('/vibe-checks');
    await expect(
      this.page.getByRole('heading', { name: 'Your Vibe Check Inbox' })
    ).toBeVisible();
  }

  /** The inbox-card for the request whose sender name matches `name`. */
  requestCardByName(name: string | RegExp) {
    return this.page
      .locator('.inbox-card')
      .filter({ has: this.page.getByText(name) });
  }

  async acceptRequestByName(name: string | RegExp): Promise<void> {
    await this.requestCardByName(name)
      .getByRole('button', { name: /accept/i })
      .click();
  }
}
