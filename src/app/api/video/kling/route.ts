import { NextRequest, NextResponse } from 'next/server';

const KLING_API_KEY = process.env.KLING_API_KEY;
const KLING_API_BASE = process.env.KLING_API_BASE || 'https://api.klingai.com/v1';

export async function POST(request: NextRequest) {
  if (!KLING_API_KEY) {
    return NextResponse.json(
      { error: 'Kling API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const {
      image_url,
      prompt = '',
      duration = 5,
      aspect_ratio = '9:16',
      cfg_scale = 5
    } = body;

    if (!image_url) {
      return NextResponse.json(
        { error: 'image_url is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${KLING_API_BASE}/video/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KLING_API_KEY}`,
      },
      body: JSON.stringify({
        image_url,
        prompt,
        duration,
        aspect_ratio,
        cfg_scale,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Kling API error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Kling proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate video generation' },
      { status: 500 }
    );
  }
}

// GET endpoint for status polling
export async function GET(request: NextRequest) {
  if (!KLING_API_KEY) {
    return NextResponse.json(
      { error: 'Kling API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');

    if (!taskId) {
      return NextResponse.json(
        { error: 'task_id is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${KLING_API_BASE}/video/status/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${KLING_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Kling status check error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Kling status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check video status' },
      { status: 500 }
    );
  }
}
