ALTER TABLE "document" ALTER COLUMN "userId" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "suggestion" ALTER COLUMN "userId" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_id_createdAt_pk" PRIMARY KEY("id","createdAt");--> statement-breakpoint
ALTER TABLE "chat" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;