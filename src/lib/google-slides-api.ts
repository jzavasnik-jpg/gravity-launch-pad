'use client';

import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

// Types
export interface SlideData {
  layout: 'TITLE' | 'SECTION_HEADER' | 'MAIN_POINT' | 'BLANK';
  title?: string;
  subtitle?: string;
  body?: string;
  backgroundImageUrl?: string;
  imageUrl?: string;
  notes?: string;
  overlayText?: {
    text: string;
    position?: 'top' | 'bottom' | 'center';
    fontSize?: number;
  };
}

export interface PresentationResult {
  presentationId: string;
  presentationUrl: string;
}

/**
 * Gets a Google Access Token via backend API
 * This requires the user to have connected their Google account with the appropriate scopes
 */
export async function getGoogleAccessToken(): Promise<string | null> {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No session found');
      return null;
    }

    // Check if user signed in with Google and has provider token
    // Supabase stores provider tokens when using OAuth
    const providerToken = session.provider_token;
    if (providerToken) {
      return providerToken;
    }

    // If no provider token, we need to re-authenticate with Google
    // This will be handled via the backend API route
    const response = await fetch('/api/auth/google-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get Google token');
    }

    const { accessToken } = await response.json();
    return accessToken;
  } catch (error: any) {
    console.error('Error getting Google access token:', error);

    if (error?.message?.includes('popup')) {
      throw new Error('POPUP_BLOCKED');
    }

    return null;
  }
}

/**
 * Creates a new Google Slides presentation
 */
export async function createPresentation(accessToken: string, title: string): Promise<PresentationResult> {
  const response = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create presentation: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    presentationId: data.presentationId,
    presentationUrl: `https://docs.google.com/presentation/d/${data.presentationId}/edit`,
  };
}

/**
 * Populates a presentation with slides
 */
export async function populateSlides(
  accessToken: string,
  presentationId: string,
  slides: SlideData[]
): Promise<void> {
  const requests: any[] = [];
  const slideIds = slides.map(() => uuidv4());

  slides.forEach((slide, index) => {
    const slideId = slideIds[index];

    requests.push({
      createSlide: {
        objectId: slideId,
        insertionIndex: index + 1,
        slideLayoutReference: {
          predefinedLayout: slide.layout
        }
      }
    });
  });

  slides.forEach((slide, index) => {
    const slideId = slideIds[index];

    if (slide.title) {
      const titleId = uuidv4();
      requests.push({
        createShape: {
          objectId: titleId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideId,
            size: {
              height: { magnitude: 100, unit: 'PT' },
              width: { magnitude: 600, unit: 'PT' }
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 50,
              translateY: 50,
              unit: 'PT'
            }
          }
        }
      });
      requests.push({
        insertText: {
          objectId: titleId,
          text: slide.title
        }
      });
    }

    if (slide.body) {
      const bodyId = uuidv4();
      requests.push({
        createShape: {
          objectId: bodyId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideId,
            size: {
              height: { magnitude: 300, unit: 'PT' },
              width: { magnitude: 600, unit: 'PT' }
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 50,
              translateY: 160,
              unit: 'PT'
            }
          }
        }
      });
      requests.push({
        insertText: {
          objectId: bodyId,
          text: slide.body
        }
      });
    }

    if (slide.imageUrl) {
      const isFullSlide = slide.layout === 'BLANK' || slide.overlayText;

      if (isFullSlide) {
        requests.push({
          createImage: {
            url: slide.imageUrl,
            elementProperties: {
              pageObjectId: slideId,
              size: {
                height: { magnitude: 540, unit: 'PT' },
                width: { magnitude: 960, unit: 'PT' }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 0,
                translateY: 0,
                unit: 'PT'
              }
            }
          }
        });
      } else {
        requests.push({
          createImage: {
            url: slide.imageUrl,
            elementProperties: {
              pageObjectId: slideId,
              size: {
                height: { magnitude: 250, unit: 'PT' },
                width: { magnitude: 350, unit: 'PT' }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 350,
                translateY: 100,
                unit: 'PT'
              }
            }
          }
        });
      }
    }

    if (slide.overlayText) {
      const textId = uuidv4();
      const position = slide.overlayText.position || 'bottom';
      const fontSize = slide.overlayText.fontSize || 36;

      let translateY = 350;
      if (position === 'top') translateY = 50;
      if (position === 'center') translateY = 220;

      requests.push({
        createShape: {
          objectId: textId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideId,
            size: {
              height: { magnitude: 150, unit: 'PT' },
              width: { magnitude: 860, unit: 'PT' }
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 50,
              translateY: translateY,
              unit: 'PT'
            }
          }
        }
      });

      requests.push({
        insertText: {
          objectId: textId,
          text: slide.overlayText.text
        }
      });

      requests.push({
        updateTextStyle: {
          objectId: textId,
          style: {
            fontSize: { magnitude: fontSize, unit: 'PT' },
            bold: true,
            foregroundColor: {
              opaqueColor: { rgbColor: { red: 1, green: 1, blue: 1 } }
            }
          },
          fields: 'fontSize,bold,foregroundColor'
        }
      });

      requests.push({
        updateParagraphStyle: {
          objectId: textId,
          style: {
            alignment: 'CENTER'
          },
          fields: 'alignment'
        }
      });
    }

    if (slide.backgroundImageUrl) {
      requests.push({
        createImage: {
          url: slide.backgroundImageUrl,
          elementProperties: {
            pageObjectId: slideId,
            size: {
              height: { magnitude: 400, unit: 'PT' },
              width: { magnitude: 720, unit: 'PT' }
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 0,
              translateY: 0,
              unit: 'PT'
            }
          }
        }
      });
    }
  });

  if (requests.length > 0) {
    const response = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: requests
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to populate slides: ${error.error?.message || response.statusText}`);
    }
  }
}

/**
 * Full workflow: Create and populate presentation
 */
export async function generateSlideDeck(
  title: string,
  slides: SlideData[],
  accessToken?: string
): Promise<PresentationResult> {
  const token = accessToken || await getGoogleAccessToken();
  if (!token) {
    throw new Error('Failed to get Google Access Token. Please sign in with Google.');
  }

  const presentation = await createPresentation(token, title);
  await populateSlides(token, presentation.presentationId, slides);

  return presentation;
}

/**
 * Gets the full presentation object
 */
export async function getPresentation(accessToken: string, presentationId: string): Promise<any> {
  const response = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get presentation: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Gets a thumbnail URL for a specific slide
 */
export async function getSlideThumbnail(
  accessToken: string,
  presentationId: string,
  pageObjectId: string
): Promise<string> {
  const response = await fetch(
    `https://slides.googleapis.com/v1/presentations/${presentationId}/pages/${pageObjectId}/thumbnail?thumbnailProperties.thumbnailSize=LARGE`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get thumbnail: ${response.statusText}`);
  }

  const data = await response.json();
  return data.contentUrl;
}
