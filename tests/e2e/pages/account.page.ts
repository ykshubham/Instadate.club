import type { Page, Locator } from '@playwright/test';
import { expect } from '../fixtures';

/**
 * Page Object for the account-lifecycle controls in the "Account & Data"
 * (DangerZone) panel of ProfileDashboard. These controls render directly on
 * `/profile` — they are NOT behind the "Settings & Verification" sheet. The
 * DangerZone sits inside the always-mounted SimplifiedSettings block at the
 * bottom of the profile scroll (src/ProfileDashboard.jsx ~line 2079).
 *
 * Selectors verified against src/ProfileDashboard.jsx:
 *   - Section heading:  "Account & Data"
 *   - Buttons:          "Export my data" · "Deactivate account" · "Delete account"
 *   - Delete modal:     getByPlaceholder('DELETE') → type "DELETE" → "Delete forever"
 *   - Deactivate modal: "Deactivate" (confirm) / "Cancel"
 *   - Inline error:     "Type DELETE to confirm." (and others) in rose text
 */
export class AccountPage {
  readonly page: Page;
  readonly sectionHeading: Locator;
  readonly exportButton: Locator;
  readonly deactivateButton: Locator;
  readonly deleteButton: Locator;
  readonly confirmInput: Locator;
  readonly deleteForeverButton: Locator;
  readonly confirmDeactivateButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sectionHeading = page.getByRole('heading', { name: 'Account & Data' });
    this.exportButton = page.getByRole('button', { name: 'Export my data' });
    this.deactivateButton = page.getByRole('button', { name: 'Deactivate account' });
    this.deleteButton = page.getByRole('button', { name: 'Delete account' });
    this.confirmInput = page.getByPlaceholder('DELETE');
    this.deleteForeverButton = page.getByRole('button', { name: 'Delete forever' });
    this.confirmDeactivateButton = page.getByRole('button', { name: 'Deactivate', exact: true });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
  }

  /** Navigate to /profile and wait for the DangerZone controls to be present. */
  async gotoProfile(): Promise<void> {
    await this.page.goto('/profile');
    // The authed+completed user is allowed to browse /profile (canBrowseApp).
    // The DangerZone renders inline — scroll it into view and assert it's there.
    await expect(this.deleteButton).toBeVisible();
  }

  /** Open the delete-account confirmation modal. */
  async openDeleteModal(): Promise<void> {
    await this.deleteButton.click();
    await expect(this.confirmInput).toBeVisible();
    await expect(this.deleteForeverButton).toBeVisible();
  }

  /** Type DELETE and confirm — drives the full destructive deletion. */
  async confirmDelete(text = 'DELETE'): Promise<void> {
    await this.confirmInput.fill(text);
    await this.deleteForeverButton.click();
  }

  /** Open the deactivate-account confirmation modal. */
  async openDeactivateModal(): Promise<void> {
    await this.deactivateButton.click();
    await expect(this.confirmDeactivateButton).toBeVisible();
  }
}
