/**
 * File Upload Module
 *
 * This folder contains file upload utilities using UploadThing.
 * Handles file uploads for attachments in chat messages.
 *
 * Files:
 * - uploadthing.ts: Server-side configuration and file router
 * - uploadthing-client.ts: Client-side upload components and hooks
 *
 * @module lib/upload
 */

export { ourFileRouter, type OurFileRouter } from "./uploadthing";
export { UploadButton, UploadDropzone, useUploadThing } from "./uploadthing-client";
