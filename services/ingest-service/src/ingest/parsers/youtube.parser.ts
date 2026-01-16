import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { YOUTUBE_CONFIG } from '../../config/env.constants';

/**
 * YouTube Parser
 * 
 * Fetches video metadata from YouTube.
 */
@Injectable()
export class YouTubeParser {
  private readonly logger = new Logger(YouTubeParser.name);

  /**
   * Extract video ID from YouTube URL
   */
  extractVideoId(url: string): string {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/channel\/([^&\n?#]+)/,
      /youtube\.com\/user\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    throw new BadRequestException('Invalid YouTube URL');
  }

  /**
   * Fetch video metadata from YouTube API
   */
  async fetchVideoMetadata(videoId: string): Promise<any> {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoId,
          key: YOUTUBE_CONFIG.API_KEY,
        },
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new BadRequestException(`Video not found: ${videoId}`);
      }

      const video = response.data.items[0];
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnailUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
        channelId: video.snippet.channelId,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        duration: this.parseDuration(video.contentDetails?.duration),
        viewCount: video.statistics?.viewCount,
        likeCount: video.statistics?.likeCount,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch YouTube video metadata: ${videoId}`, error);
      throw new BadRequestException(`Failed to fetch YouTube video: ${error.message}`);
    }
  }

  /**
   * Fetch channel videos
   */
  async fetchChannelVideos(channelId: string, maxResults: number = 50): Promise<any[]> {
    try {
      // First, get uploads playlist ID
      const channelResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
          part: 'contentDetails',
          id: channelId,
          key: YOUTUBE_CONFIG.API_KEY,
        },
      });

      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        throw new BadRequestException(`Channel not found: ${channelId}`);
      }

      const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

      // Get videos from uploads playlist
      const videosResponse = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
        params: {
          part: 'snippet,contentDetails',
          playlistId: uploadsPlaylistId,
          maxResults: Math.min(maxResults, YOUTUBE_CONFIG.MAX_RESULTS),
          key: YOUTUBE_CONFIG.API_KEY,
        },
      });

      return videosResponse.data.items.map((item: any) => ({
        videoId: item.contentDetails.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
        publishedAt: item.snippet.publishedAt,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch YouTube channel videos: ${channelId}`, error);
      throw new BadRequestException(`Failed to fetch YouTube channel: ${error.message}`);
    }
  }

  /**
   * Parse ISO 8601 duration to seconds
   */
  private parseDuration(duration: string): number | undefined {
    if (!duration) return undefined;

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return undefined;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }
}
