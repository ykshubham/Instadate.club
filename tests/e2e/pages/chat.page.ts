import { expect, type Page } from '@playwright/test';

// Page Object for the CHAT flow (selectors verified against ChatConversationPage /
// ChatInboxPage in src/main.jsx).
//
// Composer gate: the message <input> and the "Send message" button are disabled
// until the chat is voice-verified for THIS user (appState.verifiedChats[slug],
// derived from chats.verified_by_user_ids_json containing the user id). Until then
// the placeholder reads "Verify voice to send messages"; once verified it becomes
// "Write a message...". Sending additionally requires an ACCEPTED connection
// (worker assertCanSend) — set that up via API.
export class ChatPage {
  constructor(private readonly page: Page) {}

  /** Navigate straight to a conversation by slug. */
  async openConversation(slug: string): Promise<void> {
    await this.page.goto(`/chat/${slug}`);
  }

  /** The single inbox card → conversation entry point. */
  async openInbox(): Promise<void> {
    await this.page.goto('/chat');
  }

  // --- Composer affordances ---------------------------------------------------

  /** Composer text input (placeholder flips with verification state). */
  composer() {
    return this.page.locator('form.chat-composer input[type="text"], form.chat-composer input:not([type])').first();
  }

  /** The verified composer (only present/enabled once voice-verified). */
  enabledComposer() {
    return this.page.getByPlaceholder('Write a message...');
  }

  /** The gated composer placeholder shown before voice verification. */
  gatedComposer() {
    return this.page.getByPlaceholder('Verify voice to send messages');
  }

  sendButton() {
    return this.page.getByRole('button', { name: 'Send message' });
  }

  verifyVoiceButton() {
    return this.page.getByRole('button', { name: 'Verify Voice' });
  }

  /** Drive the in-UI verification affordance. */
  async verifyViaUi(): Promise<void> {
    await this.verifyVoiceButton().click();
    // After verify, the composer unlocks (placeholder flips).
    await expect(this.enabledComposer()).toBeEnabled();
  }

  /** Type + send a message through the verified composer. */
  async sendMessage(text: string): Promise<void> {
    const input = this.enabledComposer();
    await expect(input).toBeEnabled();
    await input.fill(text);
    await this.sendButton().click();
  }

  /** A message bubble carrying the given text. */
  messageBubble(text: string) {
    return this.page.locator('.message-bubble', { hasText: text });
  }
}
