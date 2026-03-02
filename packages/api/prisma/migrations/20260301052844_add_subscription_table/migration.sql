-- CreateTable
CREATE TABLE "subscription" (
    "channel_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channel_url" TEXT,
    "created_at" BIGINT NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("channel_id")
);
