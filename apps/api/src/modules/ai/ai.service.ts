import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class AiService {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_AI_STUDIO_KEY || '';
    if (!this.apiKey) {
      console.warn('GOOGLE_AI_STUDIO_KEY not configured in environment variables');
    }
  }

  /**
   * Generate bag image using free alternative APIs
   * Since Imagen requires billing and HF deprecated their free API,
   * we'll return a placeholder/mock image for development
   */
  async generateBagImage(prompt: string): Promise<string> {
    console.log('🎨 Starting image generation with prompt:', prompt.substring(0, 100));

    // Option 1: Try Replicate (if API key available)
    if (process.env.REPLICATE_API_TOKEN) {
      try {
        const replicateResult = await this.generateWithReplicate(prompt);
        if (replicateResult) {
          console.log('✅ Successfully generated with Replicate');
          return replicateResult;
        }
      } catch (error) {
        console.error('❌ Replicate failed:', error);
      }
    }

    // Option 2: Generate placeholder image
    console.log('📸 Generating placeholder image for development...');
    return this.generatePlaceholderImage(prompt);
  }

  /**
   * Generate image using Replicate API (Free tier: 50 predictions/month)
   */
  private async generateWithReplicate(prompt: string): Promise<string | null> {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) return null;

    try {
      console.log('🔄 Calling Replicate API...');

      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${apiToken}`,
        },
        body: JSON.stringify({
          version:
            'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4', // SDXL
          input: {
            prompt: prompt,
            num_inference_steps: 25,
          },
        }),
      });

      if (!response.ok) {
        console.error('Replicate error:', await response.text());
        return null;
      }

      const prediction = await response.json();

      // Poll for result
      let result = prediction;
      while (result.status !== 'succeeded' && result.status !== 'failed') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const pollResponse = await fetch(
          `https://api.replicate.com/v1/predictions/${result.id}`,
          {
            headers: { Authorization: `Token ${apiToken}` },
          },
        );
        result = await pollResponse.json();
      }

      if (result.status === 'succeeded' && result.output && result.output[0]) {
        // Download image and convert to base64
        const imageUrl = result.output[0];
        const imageResponse = await fetch(imageUrl);
        const arrayBuffer = await imageResponse.arrayBuffer();
        return Buffer.from(arrayBuffer).toString('base64');
      }

      return null;
    } catch (error) {
      console.error('Replicate generation error:', error);
      return null;
    }
  }

  /**
   * Generate a placeholder SVG image for development
   */
  private generatePlaceholderImage(prompt: string): string {
    // Extract color and product type from prompt
    const colorMatch = prompt.match(/#[0-9a-fA-F]{6}/);
    const color = colorMatch ? colorMatch[0] : '#3b82f6';

    const typeMatch = prompt.match(/mockup of a (.+?),/);
    const productType = typeMatch ? typeMatch[1] : 'Product';

    // Generate SVG placeholder
    const svg = `
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:${color};stop-opacity:0.8" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" fill="url(#grad1)"/>
        <text x="256" y="220" font-family="Arial, sans-serif" font-size="24" fill="#ffffff" text-anchor="middle" font-weight="bold">
          AI Generated Mockup
        </text>
        <text x="256" y="260" font-family="Arial, sans-serif" font-size="18" fill="#ffffff" text-anchor="middle">
          ${productType}
        </text>
        <text x="256" y="300" font-family="Arial, sans-serif" font-size="14" fill="#ffffff" text-anchor="middle" opacity="0.8">
          Color: ${color}
        </text>
        <text x="256" y="380" font-family="Arial, sans-serif" font-size="12" fill="#ffffff" text-anchor="middle" opacity="0.6">
          To enable real AI image generation:
        </text>
        <text x="256" y="400" font-family="Arial, sans-serif" font-size="12" fill="#ffffff" text-anchor="middle" opacity="0.6">
          Add REPLICATE_API_TOKEN to .env
        </text>
        <text x="256" y="420" font-family="Arial, sans-serif" font-size="12" fill="#ffffff" text-anchor="middle" opacity="0.6">
          (Free: 50 images/month at replicate.com)
        </text>
      </svg>
    `.trim();

    // Convert SVG to base64
    return Buffer.from(svg).toString('base64');
  }

  /**
   * Analyze bag image using Gemini Vision API
   */
  async analyzeImageWithVision(
    imageBase64: string,
    prompt: string,
  ): Promise<any> {
    if (!this.apiKey) {
      throw new HttpException(
        'Google AI Studio API key not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Try multiple model names in order of preference
    const models = [
      'imagen-4.0-ultra-generate-001'
    ];

    let lastError: any = null;

    for (const modelName of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': this.apiKey,
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: 'image/jpeg',
                        data: imageBase64,
                      },
                    },
                  ],
                },
              ],
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          console.log(`Successfully used model: ${modelName}`);
          return data;
        }

        // If not OK, try next model
        const errorData = await response.json();
        console.warn(`Model ${modelName} failed:`, errorData);
        lastError = errorData;
      } catch (error) {
        console.warn(`Model ${modelName} error:`, error);
        lastError = error;
        continue;
      }
    }

    // All models failed
    console.error('All Gemini models failed. Last error:', lastError);
    throw new HttpException(
      `Failed to analyze image with Gemini Vision API: ${lastError?.error?.message || 'Unknown error'}`,
      HttpStatus.BAD_REQUEST,
    );
  }

  /**
   * Analyze multiple images with Gemini Vision API
   */
  async analyzeWithVisionMultiImage(
    imagesBase64: string[],
    prompt: string,
  ): Promise<any> {
    if (!this.apiKey) {
      throw new HttpException(
        'Google AI Studio API key not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const models = [
      'gemini-3-pro-preview',
      'gemini-3-flash-preview',
      'gemini-flash-latest',
    ];

    const parts = [
      { text: prompt },
      ...imagesBase64.map((img) => ({
        inline_data: {
          mime_type: 'image/jpeg',
          data: img,
        },
      })),
    ];

    let lastError: any = null;

    for (const modelName of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': this.apiKey,
            },
            body: JSON.stringify({
              contents: [{ parts }],
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          console.log(`Successfully used model: ${modelName} for multi-image analysis`);
          return data;
        }

        const errorData = await response.json();
        console.warn(`Model ${modelName} failed:`, errorData);
        lastError = errorData;
      } catch (error) {
        console.warn(`Model ${modelName} error:`, error);
        lastError = error;
        continue;
      }
    }

    console.error('All Gemini models failed for multi-image. Last error:', lastError);
    throw new HttpException(
      `Failed to analyze images with Gemini Vision API: ${lastError?.error?.message || 'Unknown error'}`,
      HttpStatus.BAD_REQUEST,
    );
  }

  /**
   * Composite design onto bag using AI image generation
   */
  async compositeDesignOnBag(
    designBase64: string,
    bagBase64: string,
    customPrompt?: string,
  ): Promise<string> {
    if (!this.apiKey) {
      throw new HttpException(
        'Google AI Studio API key not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // Step 1: Analyze with Gemini Vision
      const baseAnalysisPrompt = `You are an expert graphic designer. I have two images:
1. A design/logo that needs to be placed on a bag
2. A photo of a paper bag

Analyze both images and describe how to create a realistic composite where the design is placed on the bag.
Consider:
- Best position on the bag (center front, top, bottom, etc.)
- Appropriate size relative to bag
- Perspective and angle to match bag orientation
- Any adjustments needed for realism

Describe the final composite image in detail for image generation.`;

      const analysisPrompt = customPrompt
        ? `${baseAnalysisPrompt}\n\nAdditional requirements from user: ${customPrompt}`
        : baseAnalysisPrompt;

      console.log('Analyzing images with Gemini Vision...');
      const visionResponse = await this.analyzeWithVisionMultiImage(
        [designBase64, bagBase64],
        analysisPrompt,
      );

      const description =
        visionResponse.candidates[0].content.parts[0].text;
      console.log('AI Analysis Result:', description);

      // Step 2: Generate composite with Imagen
      const imagenPrompt = `Professional product photography: ${description}.
High quality, realistic, studio lighting, sharp focus.
The design should look naturally integrated on the bag surface.`;

      console.log('Generating composite image with Imagen...');
      const compositeImage = await this.generateBagImage(imagenPrompt);

      return compositeImage;
    } catch (error) {
      console.error('Composite design on bag error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to composite design on bag',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
