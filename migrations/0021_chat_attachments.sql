-- 0021_chat_attachments.sql
-- Add attachment_url column to chat_messages table to support image messaging

ALTER TABLE chat_messages ADD COLUMN attachment_url TEXT;
