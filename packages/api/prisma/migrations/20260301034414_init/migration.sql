-- CreateTable
CREATE TABLE "video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "published" BIGINT NOT NULL,
    "is_short" BOOLEAN NOT NULL DEFAULT false,
    "thumbnail_url" TEXT,
    "view_count" INTEGER,
    "like_count" INTEGER,
    "description" TEXT,
    "cached_at" BIGINT NOT NULL,

    CONSTRAINT "video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_video" (
    "playlist_id" TEXT NOT NULL,
    "video_id" TEXT NOT NULL,
    "added_at" BIGINT NOT NULL,
    "order_index" INTEGER,

    CONSTRAINT "playlist_video_pkey" PRIMARY KEY ("playlist_id","video_id")
);

-- CreateTable
CREATE TABLE "watch_history" (
    "video_id" TEXT NOT NULL,
    "watched_at" BIGINT NOT NULL,

    CONSTRAINT "watch_history_pkey" PRIMARY KEY ("video_id")
);

-- CreateIndex
CREATE INDEX "video_published_idx" ON "video"("published");

-- CreateIndex
CREATE INDEX "video_cached_at_idx" ON "video"("cached_at");

-- CreateIndex
CREATE INDEX "video_is_short_idx" ON "video"("is_short");

-- CreateIndex
CREATE INDEX "playlist_video_playlist_id_idx" ON "playlist_video"("playlist_id");

-- CreateIndex
CREATE INDEX "playlist_video_video_id_idx" ON "playlist_video"("video_id");

-- CreateIndex
CREATE INDEX "watch_history_watched_at_idx" ON "watch_history"("watched_at");

-- AddForeignKey
ALTER TABLE "playlist_video" ADD CONSTRAINT "playlist_video_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_video" ADD CONSTRAINT "playlist_video_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_history" ADD CONSTRAINT "watch_history_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
