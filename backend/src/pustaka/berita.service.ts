import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ALLOWED_NEWS_DOMAINS } from './allowed-domains';
import { BLOCKED_TERMS } from './blocked-terms';
import { NewsQueryDto } from './dto/news-query.dto';
import { MOCK_NEWS, NewsItem } from './mock-berita';
import { LOCAL_REGION_NAMES } from './regions';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const SEARCH_LIMIT_PER_DAY = 30;
const NEWS_PAGE_SIZE = 10;

interface CachedNews {
  expiresAt: number;
  items: NewsItem[];
  hasMore: boolean;
}

interface DailySearchCount {
  day: string;
  count: number;
}

@Injectable()
export class BeritaService {
  private readonly logger = new Logger(BeritaService.name);
  private readonly cache = new Map<string, CachedNews>();
  private readonly dailyCounts = new Map<string, DailySearchCount>();

  constructor(private readonly config: ConfigService) {}

  async search(userId: string, query: NewsQueryDto) {
    const q = (query.q ?? '').trim();
    const requestedKabupaten = (query.kabupaten ?? '').trim();
    if (q.length > 80 || /[\u0000-\u001f\u007f]/.test(q) || /[\u0000-\u001f\u007f]/.test(requestedKabupaten)) {
      throw new BadRequestException('Kata kunci tidak valid.');
    }
    const kabupaten = requestedKabupaten
      ? LOCAL_REGION_NAMES.find((name) => name.toLocaleLowerCase('id-ID') === requestedKabupaten.toLocaleLowerCase('id-ID'))
      : undefined;
    if (requestedKabupaten && !kabupaten) {
      throw new BadRequestException('Kabupaten/kota tidak valid.');
    }
    const searchText = [q, kabupaten, 'Jawa Tengah'].filter(Boolean).join(' ');

    const normalizedQuery = searchText.toLocaleLowerCase('id-ID');
    if (BLOCKED_TERMS.some((term) => normalizedQuery.includes(term))) {
      throw new BadRequestException('Kata kunci tidak dapat digunakan.');
    }

    const urutan = query.urutan ?? 'terbaru';
    const halaman = query.halaman ?? 1;
    this.incrementDailyCount(userId);

    const enabled = this.config.get<string>('SERPAPI_ENABLED') === 'true';
    const apiKey = this.config.get<string>('SERPAPI_KEY')?.trim();
    if (!enabled) {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        return this.emptyResult('Berita belum tersedia.', halaman, false);
      }
      const start = (halaman - 1) * NEWS_PAGE_SIZE;
      const wilayah = kabupaten || 'Jawa Tengah';
      const mockItems = this.sortItems(MOCK_NEWS.map((item, index) => ({
        ...item,
        title: `Data contoh ${index + 1}: ${wilayah}`,
        snippet: `Berita fiktif untuk menguji pencarian ${q ? `"${q}" di ` : ''}${wilayah}. Bukan informasi faktual.`,
        link: `https://example.com/berita-${index + 1}?wilayah=${encodeURIComponent(wilayah)}`,
      })), urutan).slice(start, start + NEWS_PAGE_SIZE);
      return {
        items: mockItems,
        message: mockItems.length ? undefined : 'Tidak ada berita yang cocok.',
        isMock: true,
        halaman,
        hasMore: start + NEWS_PAGE_SIZE < MOCK_NEWS.length,
      };
    }
    if (!apiKey) return this.emptyResult('Berita belum tersedia.', halaman, false);

    const cacheKey = `${searchText.toLocaleLowerCase('id-ID')}|${urutan}|${halaman}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { items: cached.items, message: cached.items.length ? undefined : 'Tidak ada berita yang cocok.', isMock: false, halaman, hasMore: cached.hasMore };
    }
    if (cached) this.cache.delete(cacheKey);

    try {
      const { items, hasMore } = await this.fetchNews(apiKey, searchText, urutan, halaman);
      this.cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, items, hasMore });
      return {
        items,
        message: items.length ? undefined : 'Tidak ada berita yang cocok.',
        isMock: false,
        halaman,
        hasMore,
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException('Berita sedang tidak tersedia. Coba lagi nanti.');
    }
  }

  private incrementDailyCount(userId: string) {
    const day = new Date().toISOString().slice(0, 10);
    const current = this.dailyCounts.get(userId);
    const count = current?.day === day ? current.count : 0;
    if (count >= SEARCH_LIMIT_PER_DAY) {
      throw new HttpException('Batas pencarian hari ini sudah tercapai.', HttpStatus.TOO_MANY_REQUESTS);
    }
    this.dailyCounts.set(userId, { day, count: count + 1 });
  }

  private async fetchNews(apiKey: string, keyword: string, urutan: string, halaman: number) {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google_news');
    url.searchParams.set('hl', 'id');
    url.searchParams.set('gl', 'id');
    url.searchParams.set('q', keyword);
    url.searchParams.set('start', String((halaman - 1) * NEWS_PAGE_SIZE));
    url.searchParams.set('api_key', apiKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (response.status === 401 || response.status === 403) {
        this.logger.error(`SerpAPI authentication failed (HTTP ${response.status}).`);
        throw new ServiceUnavailableException('Berita sedang tidak tersedia.');
      }
      if (response.status === 429) {
        throw new ServiceUnavailableException('Berita sedang tidak tersedia. Coba lagi nanti.');
      }
      if (!response.ok) {
        throw new ServiceUnavailableException('Berita sedang tidak tersedia. Coba lagi nanti.');
      }

      let payload: any;
      try {
        payload = await response.json();
      } catch {
        return { items: [], hasMore: false };
      }
      if (!payload || !Array.isArray(payload.news_results)) return { items: [], hasMore: false };

      const items = payload.news_results
        .map((result: any) => this.toAllowedNewsItem(result))
        .filter((item: NewsItem | null): item is NewsItem => item !== null);
      return {
        items: this.sortItems(items, urutan),
        hasMore: payload.news_results.length >= NEWS_PAGE_SIZE,
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException('Berita sedang tidak tersedia. Coba lagi nanti.');
    } finally {
      clearTimeout(timeout);
    }
  }

  private toAllowedNewsItem(result: any): NewsItem | null {
    if (!result || typeof result.title !== 'string' || typeof result.link !== 'string') return null;
    try {
      const url = new URL(result.link);
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      const host = url.hostname.toLowerCase();
      const allowed = ALLOWED_NEWS_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
      if (!allowed) return null;

      return {
        title: result.title.slice(0, 300),
        snippet: typeof result.snippet === 'string' ? result.snippet.slice(0, 800) : '',
        source: typeof result.source?.name === 'string' ? result.source.name.slice(0, 120) : host,
        date: typeof result.iso_date === 'string' ? result.iso_date : typeof result.date === 'string' ? result.date : '',
        link: url.toString(),
      };
    } catch {
      return null;
    }
  }

  private sortItems(items: NewsItem[], order: string) {
    if (order === 'relevan') return items;
    return items.sort((left, right) => {
      const leftDate = Date.parse(left.date) || 0;
      const rightDate = Date.parse(right.date) || 0;
      return order === 'terlama' ? leftDate - rightDate : rightDate - leftDate;
    });
  }

  private emptyResult(message: string, halaman: number, isMock: boolean) {
    return { items: [], message, isMock, halaman, hasMore: false };
  }
}