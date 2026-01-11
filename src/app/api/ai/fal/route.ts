import { NextRequest, NextResponse } from 'next/server';

const FAL_KEY = process.env.FAL_KEY;

export async function POST(request: NextRequest) {
  if (!FAL_KEY) {
    return NextResponse.json(
      { error: 'FAL API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const {
      prompt,
      model = 'fal-ai/flux-pro/v1.1',
      image_size = 'landscape_16_9',
      safety_tolerance = '2',
      num_images = 1
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // FAL.ai uses a queue-based system
    const response = await fetch(`https://queue.fal.run/${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${FAL_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        image_size,
        safety_tolerance,
        num_images,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'FAL API error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('FAL proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Handle status polling for async jobs
export async function GET(request: NextRequest) {
  if (!FAL_KEY) {
    return NextResponse.json(
      { error: 'FAL API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('request_id');
    const model = searchParams.get('model') || 'fal-ai/flux-pro/v1.1';

    if (!requestId) {
      return NextResponse.json(
        { error: 'request_id is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`https://queue.fal.run/${model}/requests/${requestId}/status`, {
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'FAL status check error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('FAL status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
