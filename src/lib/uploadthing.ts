import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getCurrentUser } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  // For chat message attachments (images)
  messageImage: f({
    image: { maxFileSize: "8MB", maxFileCount: 4 },
  })
    .middleware(async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl, name: file.name };
    }),

  // For chat message attachments (documents)
  messageDocument: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 4 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 4 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
      maxFileCount: 4,
    },
    "application/vnd.ms-excel": { maxFileSize: "16MB", maxFileCount: 4 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      maxFileSize: "16MB",
      maxFileCount: 4,
    },
    "text/plain": { maxFileSize: "4MB", maxFileCount: 4 },
  })
    .middleware(async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl, name: file.name, size: file.size };
    }),

  // For any file type
  messageAttachment: f({
    image: { maxFileSize: "8MB", maxFileCount: 4 },
    video: { maxFileSize: "64MB", maxFileCount: 1 },
    audio: { maxFileSize: "16MB", maxFileCount: 4 },
    pdf: { maxFileSize: "16MB", maxFileCount: 4 },
    blob: { maxFileSize: "16MB", maxFileCount: 4 },
  })
    .middleware(async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
        type: file.type,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
