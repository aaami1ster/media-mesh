import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Parser from 'rss-parser';

/**
 * RSS Parser
 * 
 * Parses RSS feeds and extracts episodes.
 */
@Injectable()
export class RSSParser {
  private readonly logger = new Logger(RSSParser.name);
  private readonly parser: Parser;

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: ['itunes:duration', 'itunes:episode', 'itunes:season'],
      },
    });
  }

  /**
   * Parse RSS feed
   */
  async parseFeed(feedUrl: string): Promise<any> {
    try {
      const feed = await this.parser.parseURL(feedUrl);

      return {
        title: feed.title,
        description: feed.description,
        link: feed.link,
        items: feed.items.map((item) => ({
          title: item.title,
          description: item.contentSnippet || item.content || item.description,
          link: item.link,
          pubDate: item.pubDate,
          guid: item.guid,
          enclosure: item.enclosure,
          itunes: {
            duration: (item as any)['itunes:duration'],
            episode: (item as any)['itunes:episode'],
            season: (item as any)['itunes:season'],
          },
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to parse RSS feed: ${feedUrl}`, error);
      throw new BadRequestException(`Failed to parse RSS feed: ${error.message}`);
    }
  }

  /**
   * Extract episode number from RSS item
   */
  extractEpisodeNumber(item: any): number | undefined {
    // Try iTunes episode number first
    if (item.itunes?.episode) {
      return parseInt(item.itunes.episode, 10);
    }

    // Try to extract from title
    const titleMatch = item.title?.match(/[Ee]pisode\s*(\d+)/);
    if (titleMatch) {
      return parseInt(titleMatch[1], 10);
    }

    // Try to extract from GUID
    const guidMatch = item.guid?.match(/(\d+)$/);
    if (guidMatch) {
      return parseInt(guidMatch[1], 10);
    }

    return undefined;
  }
}
