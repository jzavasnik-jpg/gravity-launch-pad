import { NextRequest, NextResponse } from 'next/server';

const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
const REDDIT_USER_AGENT = process.env.REDDIT_USER_AGENT || 'LaunchPad/1.0';

interface TokenCache {
  token: string;
  expiresAt: number;
}

let cachedToken: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  // Check cache
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
    throw new Error('Reddit API credentials not configured');
  }

  const auth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');

  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': REDDIT_USER_AGENT,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Reddit auth failed: ${response.statusText}`);
  }

  const data = await response.json();

  // Cache token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000) - 60000,
  };

  return data.access_token;
}

export async function POST(request: NextRequest) {
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Reddit API credentials not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { keywords, subreddit, limit = 10, sort = 'relevance', time = 'year' } = body;

    if (!keywords) {
      return NextResponse.json(
        { error: 'Keywords are required' },
        { status: 400 }
      );
    }

    const token = await getAccessToken();

    const subredditPath = subreddit ? `r/${subreddit}/` : '';
    const searchUrl = `https://oauth.reddit.com/${subredditPath}search?q=${encodeURIComponent(keywords)}&restrict_sr=${subreddit ? '1' : '0'}&sort=${sort}&limit=${limit}&t=${time}`;

    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': REDDIT_USER_AGENT,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Reddit search failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Reddit proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to search Reddit' },
      { status: 500 }
    );
  }
}
