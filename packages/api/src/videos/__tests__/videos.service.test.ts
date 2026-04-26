import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { VideosService } from '../videos.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { SubscriptionsService } from '../../subscriptions/subscriptions.service.js';
import type { EventsGateway } from '../../events/events.gateway.js';

const SAMPLE_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"
      xmlns:media="http://search.yahoo.com/mrss/"
      xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <yt:videoId>vid_full</yt:videoId>
    <title>Full Video</title>
    <published>2026-04-20T10:00:00+00:00</published>
    <link rel="alternate" href="https://www.youtube.com/watch?v=vid_full"/>
    <author><name>Channel One</name></author>
    <media:group>
      <media:description>A long description</media:description>
      <media:thumbnail url="https://i.ytimg.com/vi/vid_full/small.jpg" width="120" height="90"/>
      <media:thumbnail url="https://i.ytimg.com/vi/vid_full/large.jpg" width="480" height="360"/>
      <media:community>
        <media:statistics views="12345"/>
        <media:starRating count="678"/>
      </media:community>
    </media:group>
  </entry>
  <entry>
    <yt:videoId>vid_short</yt:videoId>
    <title>A Short</title>
    <published>2026-04-21T11:00:00+00:00</published>
    <link rel="alternate" href="https://www.youtube.com/shorts/vid_short"/>
    <author><name>Channel Two</name></author>
    <media:group/>
  </entry>
  <entry>
    <title>Missing video id, should be skipped</title>
    <published>2026-04-22T12:00:00+00:00</published>
    <link rel="alternate" href="https://www.youtube.com/watch?v=ignored"/>
    <author><name>Channel Three</name></author>
  </entry>
</feed>`;

function makeService(): VideosService {
  const prisma = {} as PrismaService;
  const subs = {} as SubscriptionsService;
  const events = {} as EventsGateway;
  return new VideosService(prisma, subs, events);
}

const originalFetch = globalThis.fetch;

describe('VideosService.fetchRSSFeed', () => {
  let service: VideosService;
  let lastUrl: string | undefined;

  beforeEach(() => {
    service = makeService();
    lastUrl = undefined;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function stubFetch(body: string, init: { ok?: boolean; status?: number } = {}) {
    globalThis.fetch = mock((url: string) => {
      lastUrl = url;
      return Promise.resolve(
        new Response(body, { status: init.status ?? (init.ok === false ? 500 : 200) }),
      );
    }) as unknown as typeof fetch;
  }

  test('builds the channel-scoped RSS URL', async () => {
    stubFetch(SAMPLE_FEED);
    await (service as unknown as { fetchRSSFeed: (id: string) => Promise<unknown> })
      .fetchRSSFeed('UC123');
    expect(lastUrl).toBe('https://www.youtube.com/feeds/videos.xml?channel_id=UC123');
  });

  test('parses entries and maps fields', async () => {
    stubFetch(SAMPLE_FEED);
    const videos = await (service as unknown as {
      fetchRSSFeed: (id: string) => Promise<Array<Record<string, unknown>>>;
    }).fetchRSSFeed('UC123');

    expect(videos).toHaveLength(2);

    expect(videos[0]).toEqual({
      videoId: 'vid_full',
      title: 'Full Video',
      channel: 'Channel One',
      link: 'https://www.youtube.com/watch?v=vid_full',
      published: '2026-04-20T10:00:00.000Z',
      isShort: false,
      thumbnailUrl: 'https://i.ytimg.com/vi/vid_full/large.jpg',
      viewCount: 12345,
      likeCount: 678,
      description: 'A long description',
    });
  });

  test('flags shorts links via /shorts/ in href', async () => {
    stubFetch(SAMPLE_FEED);
    const videos = await (service as unknown as {
      fetchRSSFeed: (id: string) => Promise<Array<{ videoId: string; isShort: boolean }>>;
    }).fetchRSSFeed('UC123');
    const short = videos.find((v) => v.videoId === 'vid_short');
    expect(short?.isShort).toBe(true);
  });

  test('falls back to img.youtube.com thumbnail when none provided', async () => {
    stubFetch(SAMPLE_FEED);
    const videos = await (service as unknown as {
      fetchRSSFeed: (id: string) => Promise<Array<{ videoId: string; thumbnailUrl: string }>>;
    }).fetchRSSFeed('UC123');
    const short = videos.find((v) => v.videoId === 'vid_short');
    expect(short?.thumbnailUrl).toBe('https://img.youtube.com/vi/vid_short/mqdefault.jpg');
  });

  test('skips entries without a yt:videoId', async () => {
    stubFetch(SAMPLE_FEED);
    const videos = await (service as unknown as {
      fetchRSSFeed: (id: string) => Promise<Array<{ videoId: string }>>;
    }).fetchRSSFeed('UC123');
    expect(videos.map((v) => v.videoId)).toEqual(['vid_full', 'vid_short']);
  });

  test('omits viewCount/likeCount when stats absent', async () => {
    stubFetch(SAMPLE_FEED);
    const videos = await (service as unknown as {
      fetchRSSFeed: (id: string) => Promise<Array<{ videoId: string; viewCount?: number; likeCount?: number }>>;
    }).fetchRSSFeed('UC123');
    const short = videos.find((v) => v.videoId === 'vid_short');
    expect(short?.viewCount).toBeUndefined();
    expect(short?.likeCount).toBeUndefined();
  });

  test('throws on non-2xx HTTP responses', async () => {
    stubFetch('', { ok: false, status: 404 });
    await expect(
      (service as unknown as { fetchRSSFeed: (id: string) => Promise<unknown> })
        .fetchRSSFeed('UC404'),
    ).rejects.toThrow('HTTP 404 from RSS feed');
  });

  test('returns empty array on malformed XML', async () => {
    stubFetch('<not-xml');
    const videos = await (service as unknown as {
      fetchRSSFeed: (id: string) => Promise<unknown[]>;
    }).fetchRSSFeed('UCbad');
    expect(videos).toEqual([]);
  });

  test('returns empty array when feed has no entries', async () => {
    stubFetch(`<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"></feed>`);
    const videos = await (service as unknown as {
      fetchRSSFeed: (id: string) => Promise<unknown[]>;
    }).fetchRSSFeed('UCempty');
    expect(videos).toEqual([]);
  });
});
