import { type Page, type Locator, expect } from '@playwright/test';

// Page Object for the DISCOVERY flow (`/members`, component `MembersPage` in
// src/main.jsx, with `MemberCard` and `MemberProfileModal`).
//
// DOM facts verified against the running app / source (src/main.jsx ~2140+):
//  • Each member is an <article class="member-card" role="button"> rendered inside
//    a `.gsap-member-card` wrapper in `.member-grid`. Card header name is an <h3>
//    that shows only the first name + age; city sits in the <p> below it.
//  • The card's connect affordance is an ICON-ONLY button (Send icon) with
//    title="Send vibe check" / "Vibe sent" — there is NO literal "Connect" text on
//    the card. Clicking the card body (not that button) opens the profile modal.
//  • `MemberProfileModal` is a <div role="dialog" aria-modal="true"> whose <h2>
//    shows the full "Name, Age", a <p> shows the city, and a primary button reads
//    "Send Vibe Check" / "Vibe Sent" (this is the README's abstract "Connect").
//  • Search input: placeholder "Filter by city, name, or vibe..." (client-side
//    filter over name + city + vibe).
//
// The seeded DB exposes ~10 completed members via GET /api/members. The member DTO
// is sanitized server-side (worker/dto.ts): no whatsapp / phone / instagram handle
// / email ever reaches the card.
export class DiscoveryPage {
  readonly page: Page;
  readonly membersNav: Locator;
  readonly grid: Locator;
  readonly cards: Locator;
  readonly search: Locator;
  readonly modal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.membersNav = page.getByRole('button', { name: 'Members' });
    this.grid = page.locator('.member-grid');
    // Resilient card locator: the article carries class `member-card` and
    // role="button"; scope counts to these to avoid the skeleton shimmer.
    this.cards = page.locator('article.member-card');
    this.search = page.getByPlaceholder('Search by name, vibe, or interest...');
    this.modal = page.locator('[role="dialog"][aria-modal="true"]');
  }

  /** Navigate to the members list and wait for cards to render. */
  async goto(): Promise<void> {
    await this.page.goto('/members');
    await this.waitForCards();
  }

  /** From the current (authenticated) page, open discovery via the header nav. */
  async openFromNav(): Promise<void> {
    await this.membersNav.click();
    await this.waitForCards();
  }

  /** The grid loads asynchronously (fetch + 800ms shimmer); wait for >=1 card. */
  async waitForCards(): Promise<void> {
    await expect(this.cards.first()).toBeVisible();
  }

  /** Open the profile modal for the Nth member card (clicks the card body). */
  async openProfile(index = 0): Promise<void> {
    // Click the card header (away from the icon connect button, which stops
    // propagation) so the article's onClick fires and the modal opens.
    await this.cards.nth(index).locator('h3').click();
    await expect(this.modal).toBeVisible();
  }

  /** Close the open profile modal by clicking the backdrop. */
  async closeProfile(): Promise<void> {
    // The backdrop closes on click; click at a corner away from the sheet.
    await this.page.locator('.member-profile-backdrop').click({ position: { x: 5, y: 5 } });
    await expect(this.modal).toBeHidden();
  }

  /** Filter the list with a query string. */
  async filter(text: string): Promise<void> {
    await this.search.fill(text);
  }
}
