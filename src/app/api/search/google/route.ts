import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

export async function POST(request: NextRequest) {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    return NextResponse.json(
      { error: 'Google Search API credentials not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const {
      query,
      num = 10,
      dateRestrict = 'y1',
      siteSearch,
      siteSearchFilter
    } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    let url = `https://www.googleapis.com/customsearch/v1?` +
      `key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}` +
      `&q=${encodeURIComponent(query)}` +
      `&num=${Math.min(num, 10)}` +
      `&dateRestrict=${dateRestrict}`;

    if (siteSearch) {
      url += `&siteSearch=${encodeURIComponent(siteSearch)}`;
    }
    if (siteSearchFilter) {
      url += `&siteSearchFilter=${siteSearchFilter}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || 'Google Search API error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Google Search proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    );
  }
}
