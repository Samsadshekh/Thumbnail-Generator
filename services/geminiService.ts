import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { ImageFile } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const NUM_VARIATIONS = 2; // Generate 2 variations

export const analyzeContent = async (
    title: string,
    mainImage: ImageFile
): Promise<string[]> => {
    const model = 'gemini-2.5-flash';

    const prompt = `Analyze the provided title "${title}" and the attached main image. Based on this content, determine the likely video genre and target audience. Then, generate 3 distinct, creative, and compelling design concepts for a YouTube thumbnail. Each concept should be a concise, actionable description for a designer. For example: 'A high-energy, gaming style with neon text and dynamic angles' or 'A clean, professional look for a tech review with bold, simple fonts'.`;

    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: mainImage.mimeType,
                        data: mainImage.base64
                    }
                }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    concepts: {
                        type: Type.ARRAY,
                        description: "A list of 3 distinct design concepts for the thumbnail.",
                        items: {
                            type: Type.STRING
                        }
                    }
                }
            }
        }
    });

    try {
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        if (result.concepts && Array.isArray(result.concepts) && result.concepts.length > 0) {
            return result.concepts;
        }
    } catch (e) {
        console.error("Failed to parse JSON response from analysis:", e);
        throw new Error("The AI failed to generate valid design concepts. Please try again.");
    }
    
    throw new Error("The AI did not return any design concepts. Please try again.");
};

export const generateThumbnails = async (
    prompt: string,
    mainImage: ImageFile,
    logoImage: ImageFile | null,
    overlayImage: ImageFile | null,
    inspirationImage: ImageFile | null
): Promise<string[]> => {
    const model = 'gemini-2.5-flash-image-preview';

    const parts: any[] = [{ text: prompt }];

    // IMPORTANT: The model expects the 'inspiration' image first if provided, then text, then other images.
    // The prompt guides the model on how to use each subsequent image.
    if (inspirationImage) {
        parts.unshift({ // Add to the beginning
            inlineData: { mimeType: inspirationImage.mimeType, data: inspirationImage.base64 },
        });
    }

    parts.push({
        inlineData: { mimeType: mainImage.mimeType, data: mainImage.base64 },
    });

    if (logoImage) {
        parts.push({
            inlineData: { mimeType: logoImage.mimeType, data: logoImage.base64 },
        });
    }

    if (overlayImage) {
        parts.push({
            inlineData: { mimeType: overlayImage.mimeType, data: overlayImage.base64 },
        });
    }

    const generationPromises = Array(NUM_VARIATIONS).fill(0).map(() => 
        ai.models.generateContent({
            model: model,
            contents: { parts: parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        })
    );
    
    const responses = await Promise.all(generationPromises);

    const imageUrls: string[] = [];

    for (const response of responses) {
        if (response.candidates && response.candidates.length > 0) {
            const imagePart = response.candidates[0].content.parts.find(
                (part) => part.inlineData
            );
            if (imagePart && imagePart.inlineData) {
                const base64ImageBytes = imagePart.inlineData.data;
                const mimeType = imagePart.inlineData.mimeType;
                const imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
                imageUrls.push(imageUrl);
            }
        }
    }

    if (imageUrls.length === 0) {
        throw new Error('AI failed to generate any images. Please try adjusting your prompt or images.');
    }

    return imageUrls;
};

export const generateThumbnailsFromPrompt = async (
    prompt: string
): Promise<string[]> => {
    const fullPrompt = `Create a professional, high-resolution (1280x720) YouTube thumbnail with a 16:9 aspect ratio. The thumbnail should be visually striking, with high contrast and clear, readable text. Style it based on the following user request: "${prompt}"`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
          numberOfImages: NUM_VARIATIONS,
          outputMimeType: 'image/png',
          aspectRatio: '16:9',
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error('AI failed to generate any images from the prompt.');
    }

    const imageUrls = response.generatedImages.map(img => {
        const base64ImageBytes = img.image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    });

    return imageUrls;
};
