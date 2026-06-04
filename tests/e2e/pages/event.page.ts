import { type Page, type Locator, expect, type APIRequestContext } from '@playwright/test';

// POST a JSON body, tolerating a transient worker reset (the local wrangler dev
// isolate can drop a connection mid-request and restart within ~20s).
async function postWithRetry(
  request: APIRequestContext,
  url: string,
  data: unknown,
  attempts = 4
): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      await request.post(url, { data });
      return;
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// Page Object for the EVENT flow.
//   • Events list:  `/events`  → `EventsPage`  (src/main.jsx ~4003)
//   • Host an event: `/host`   → `HostEventPage` (src/main.jsx ~3839)
//
// DOM facts verified against src/main.jsx:
//  • Each event renders as <article class="event-card"> inside a `.gsap-event-card`
//    wrapper in `.event-grid`. The title is an <h3>.
//  • The RSVP toggle is the LAST button in the card. Its label depends on state:
//      - not RSVP'd, hosted plan   → "Join Plan Tonight"
//      - not RSVP'd, mixer/other   → "Reserve Spot Securely"
//      - already RSVP'd            → "Leave Plan"
//    (src/main.jsx EventCard ~4789). Toggling calls POST/DELETE
//    /api/events/:id/attendees/me and fires a toast:
//      - join   → "RSVP confirmed for <title>"
//      - leave  → "RSVP removed"
//    (src/main.jsx toggleRsvp ~986). Toasts render as <div class="app-toast">.
//  • Hosting (POST /api/events) is gated by `requireVerified` in the worker
//    (worker/authz.ts) — a profile with verification_level === 'none' gets a 403.
//    Verification can be arranged via API: POST /api/settings/verify {type:'phone'}
//    (level → 'basic', which satisfies the gate).
//  • HostEventPage form: plan-type chips, "Plan Title" <input>, "Description"
//    <textarea>, "Location" <input>, type=date / type=time inputs, "Capacity"
//    number input, Free/Paid segmented control, and a submit button
//    "Create Joinable Plan" (disabled until title/description/location/date/time/
//    capacity are all filled). On success the app navigates back to /events.
export class EventPage {
  readonly page: Page;
  readonly eventsNav: Locator;
  readonly grid: Locator;
  readonly cards: Locator;
  readonly toast: Locator;

  // RSVP button states (used to find / assert against a card's toggle button).
  readonly rsvpJoinButtons: Locator;   // "Join Plan Tonight" | "Reserve Spot Securely"
  readonly rsvpLeaveButtons: Locator;  // "Leave Plan"

  constructor(page: Page) {
    this.page = page;
    this.eventsNav = page.getByRole('button', { name: 'Events' });
    this.grid = page.locator('.event-grid');
    this.cards = page.locator('article.event-card');
    this.toast = page.locator('.app-toast');
    this.rsvpJoinButtons = page.getByRole('button', {
      name: /Join Plan Tonight|Reserve Spot Securely/i
    });
    this.rsvpLeaveButtons = page.getByRole('button', { name: /Leave Plan/i });
  }

  /** Navigate to the events list and wait for at least one card. */
  async goto(): Promise<void> {
    await this.page.goto('/events');
    await this.waitForCards();
  }

  /** From the current authenticated page, open events via the header nav. */
  async openFromNav(): Promise<void> {
    await this.eventsNav.click();
    await this.waitForCards();
  }

  async waitForCards(): Promise<void> {
    await expect(this.cards.first()).toBeVisible();
  }

  /** The RSVP toggle button is the last button inside the given card. */
  rsvpButton(card: Locator): Locator {
    return card.getByRole('button').last();
  }

  async goToHost(): Promise<void> {
    const createBtn = this.page.getByRole('button', { name: /Create Joinable Plan/i });
    await this.page.goto('/host');
    // The app shell mounts after its initial state fetch; under a slow cold start
    // the host form can lag. Retry the navigation once before asserting.
    try {
      await expect(createBtn).toBeVisible({ timeout: 15000 });
    } catch {
      await this.page.goto('/host');
      await expect(createBtn).toBeVisible({ timeout: 15000 });
    }
  }

  /**
   * Client-side (SPA) navigation to the events list via the header nav button.
   * Unlike `goto('/events')`, this does NOT reload the page, so any optimistic
   * in-memory app state (e.g. a just-hosted event) is preserved.
   */
  async openEventsViaNav(): Promise<void> {
    await this.eventsNav.click();
    await expect(this.page).toHaveURL(/\/events$/);
  }

  /**
   * Fill the host-event form and submit. Returns nothing; on success the app
   * navigates to /events.
   */
  async hostEvent(fields: {
    title: string;
    description: string;
    location: string;
    date: string; // yyyy-mm-dd
    time: string; // HH:MM
    capacity?: string;
  }): Promise<void> {
    await this.page.getByPlaceholder('Mission Impossible at 8 PM. Need 2 people.').fill(fields.title);
    await this.page
      .getByPlaceholder('What are you doing, who should join, and why will it be fun?')
      .fill(fields.description);
    await this.page.getByPlaceholder('Search a venue — cafe, bar, restaurant, park…').fill(fields.location);
    await this.page.locator('input[type="date"]').fill(fields.date);
    await this.page.locator('input[type="time"]').fill(fields.time);
    if (fields.capacity) {
      await this.page.locator('input[type="number"]').first().fill(fields.capacity);
    }
    const submit = this.page.getByRole('button', { name: /Create Joinable Plan/i });
    await expect(submit).toBeEnabled();
    await submit.click();
  }

  /**
   * Arrange-via-API: make the seeded member verified enough to host
   * (verification_level !== 'none'), satisfying requireVerified.
   */
  static async verifyForHosting(request: APIRequestContext): Promise<void> {
    await postWithRetry(request, '/api/settings/verify', { type: 'phone' });
    await postWithRetry(request, '/api/settings/verify', { type: 'selfie' });
  }
}
