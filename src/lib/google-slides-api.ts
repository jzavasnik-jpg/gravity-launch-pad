import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";

// Types
export interface SlideData {
    layout: 'TITLE' | 'SECTION_HEADER' | 'MAIN_POINT' | 'BLANK';
    title?: string;
    subtitle?: string;
    body?: string;
    backgroundImageUrl?: string; // Must be a publicly accessible URL
    imageUrl?: string; // Content image (full-slide visual)
    notes?: string;
    // NEW: Text overlay for slides with pure visual backgrounds
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
 * Gets a fresh Google Access Token by re-authenticating the user.
 * This is required because Firebase doesn't persist the provider access token.
 */
export async function getGoogleAccessToken(): Promise<string | null> {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/presentations');
    provider.addScope('https://www.googleapis.com/auth/drive.file');

    try {
        // We use signInWithPopup to force a fresh token retrieval
        // This works even if the user is already signed in (it just re-verifies)
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        return credential?.accessToken || null;
    } catch (error: any) {
        console.error("Error getting Google access token:", error);

        // Handle popup-blocked error specifically
        if (error?.code === 'auth/popup-blocked') {
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

    // 1. Create slides
    const slideIds = slides.map(() => uuidv4());

    slides.forEach((slide, index) => {
        const slideId = slideIds[index];

        // Create Slide Request
        requests.push({
            createSlide: {
                objectId: slideId,
                insertionIndex: index + 1, // Insert after title slide (0 is title slide usually)
                slideLayoutReference: {
                    predefinedLayout: slide.layout
                }
            }
        });
    });

    // 2. Add Content (Text, Images)
    // We need to execute the create requests first or batch them carefully.
    // Google Slides API allows batching create and update in one go if we use the IDs we generated.

    slides.forEach((slide, index) => {
        const slideId = slideIds[index];

        // Add Title
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

        // Add Body
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

        // Add Content Image (Full-Screen if it's the main visual)
        if (slide.imageUrl) {
            const isFullSlide = slide.layout === 'BLANK' || slide.overlayText;

            if (isFullSlide) {
                // Full-screen image for pure visual slides
                requests.push({
                    createImage: {
                        url: slide.imageUrl,
                        elementProperties: {
                            pageObjectId: slideId,
                            size: {
                                height: { magnitude: 540, unit: 'PT' }, // Full slide height
                                width: { magnitude: 960, unit: 'PT' }  // Full slide width
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
                // Partial image (original behavior)
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
                                translateX: 350, // Right side
                                translateY: 100,
                                unit: 'PT'
                            }
                        }
                    }
                });
            }
        }

        // Add Text Overlay (for pure visual slides)
        if (slide.overlayText) {
            const textId = uuidv4();
            const position = slide.overlayText.position || 'bottom';
            const fontSize = slide.overlayText.fontSize || 36;

            // Calculate Y position based on desired placement
            let translateY = 350; // bottom (default)
            if (position === 'top') translateY = 50;
            if (position === 'center') translateY = 220;

            // Create text box
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

            // Insert text
            requests.push({
                insertText: {
                    objectId: textId,
                    text: slide.overlayText.text
                }
            });

            // Style text (bold, large, white with shadow for readability)
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

            // Center align text
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

        // Add Background Image
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
            // Send to back
            // requests.push({ ... }) 
        }
    });

    // Execute Batch Update
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
    // Use provided token or get a new one
    const token = accessToken || await getGoogleAccessToken();
    if (!token) {
        throw new Error("Failed to get Google Access Token. Please sign in.");
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
