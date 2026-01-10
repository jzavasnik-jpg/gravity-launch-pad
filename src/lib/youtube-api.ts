/**
 * YouTube API Client - Uses Backend Proxy
 *
 * All YouTube API calls go through our backend server which uses the app's
 * API key. This means users don't need to authenticate - it just works.
 */

const BACKEND_URL = 'http://localhost:3001';

export interface YouTubeVideo {
    id: string;
    title: string;
    description: string;
    channelTitle: string;
    publishTime: string;
    thumbnail: string;
}

export interface YouTubeComment {
    id: string;
    text: string;
    author: string;
    publishTime: string;
    likeCount: number;
    videoId: string;
    videoTitle: string;
}

/**
 * Search for relevant videos on YouTube
 * Uses backend proxy with app's API key
 */
export async function searchVideos(query: string, limit: number = 5): Promise<YouTubeVideo[]> {
    try {
        const response = await fetch(`${BACKEND_URL}/api/youtube/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, maxResults: limit }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.warn('[YouTube API] Search failed:', error.error);
            return [];
        }

        const data = await response.json();
        return data.videos || [];

    } catch (error: any) {
        console.warn('[YouTube API] Search error:', error.message);
        return [];
    }
}

/**
 * Get top comments from a specific video
 * Uses backend proxy with app's API key
 */
export async function getVideoComments(videoId: string, limit: number = 20): Promise<YouTubeComment[]> {
    try {
        const response = await fetch(`${BACKEND_URL}/api/youtube/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId, maxResults: limit }),
        });

        if (!response.ok) {
            // Comments might be disabled for some videos
            return [];
        }

        const data = await response.json();
        return (data.comments || []).map((c: any) => ({
            ...c,
            videoTitle: '' // Will be filled by caller
        }));

    } catch (error: any) {
        console.warn(`[YouTube API] Failed to fetch comments for video ${videoId}:`, error.message);
        return [];
    }
}

/**
 * Orchestrator: Search videos and aggregate comments
 * ROBUST VALIDATION: Fetches from multiple videos for better coverage
 */
export async function searchYouTubeComments(
    keywords: string,
    limit: number = 25
): Promise<YouTubeComment[]> {
    try {
        // 1. Search for videos
        const videoCount = Math.min(5, Math.ceil(limit / 10));
        const videos = await searchVideos(keywords, videoCount);

        if (videos.length === 0) {
            console.log('[YouTube API] No videos found for keywords:', keywords);
            return [];
        }

        // 2. Fetch comments from each video in parallel
        const commentsPerVideo = Math.ceil(limit / videoCount) + 5;
        const commentPromises = videos.map(video =>
            getVideoComments(video.id, commentsPerVideo).then(comments =>
                comments.map(c => ({ ...c, videoTitle: video.title }))
            )
        );

        const allComments = (await Promise.all(commentPromises)).flat();

        console.log(`[YouTube API] Fetched ${allComments.length} comments from ${videos.length} videos for keywords: "${keywords}"`);

        // 3. Sort by likes and return top N
        return allComments
            .sort((a, b) => b.likeCount - a.likeCount)
            .slice(0, limit);

    } catch (error: any) {
        console.error('[YouTube API] Market Intelligence failed:', error.message);
        return [];
    }
}

/**
 * Check if YouTube API is available
 * Always returns true since backend handles API key
 */
export function isYouTubeApiAvailable(): boolean {
    return true;
}
