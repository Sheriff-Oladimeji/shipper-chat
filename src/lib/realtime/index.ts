/**
 * Realtime Module
 *
 * This folder contains real-time communication utilities using Pusher.
 * Handles WebSocket connections for live messaging features.
 *
 * Features:
 * - Server-side Pusher instance for triggering events
 * - Client-side Pusher instance for subscribing to channels
 * - Channel naming utilities for conversations and users
 * - Event type constants
 *
 * @module lib/realtime
 */

export {
  getPusherServer,
  pusherServer,
  getPusherClient,
  getConversationChannel,
  getUserChannel,
  PRESENCE_CHANNEL,
  PUSHER_EVENTS,
} from "./pusher";
