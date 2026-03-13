import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

// Vertex AI configuration
const PROJECT_ID = 'gen-lang-client-0904075747';
const LOCATION = 'global';

let authClient: GoogleAuth | null = null;

async function getAccessToken(): Promise<string> {
  if (!authClient) {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}');
    authClient = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
  }
  const token = await authClient.getAccessToken();
  if (!token) throw new Error('Failed to get access token');
  return token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      model = 'gemini-2.0-flash-001',
      parts,
      generateImage = false,
      imageModel = 'gemini-2.0-flash-exp-image-generation'
    } = body;

    const accessToken = await getAccessToken();

    // For image generation
    if (generateImage) {
      const endpoint = `https://aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${imageModel}:generateContent`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: parts || [{ text: prompt }]
          }],
          generationConfig: {
            responseMimeType: 'image/png'
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return NextResponse.json(
          { error: error.error?.message || 'Vertex AI error' },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // For text generation
    const endpoint = `https://aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${model}:generateContent`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: parts || [{ text: prompt }]
        }]
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || 'Vertex AI error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Vertex AI proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
