import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import { AnalyzeBagDto } from './dto/analyze-bag.dto';
import { CompositeBagDto } from './dto/composite-bag.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-bag-image')
  async generateBagImage(@Body() dto: GenerateImageDto) {
    const imageBase64 = await this.aiService.generateBagImage(dto.prompt);
    return {
      success: true,
      image: `data:image/png;base64,${imageBase64}`,
    };
  }

  @Post('analyze-bag')
  async analyzeBag(@Body() dto: AnalyzeBagDto) {
    const result = await this.aiService.analyzeImageWithVision(
      dto.imageBase64,
      dto.prompt,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('composite-bag-design')
  async compositeBagDesign(@Body() dto: CompositeBagDto) {
    const result = await this.aiService.compositeDesignOnBag(
      dto.designImageBase64,
      dto.bagImageBase64,
      dto.customPrompt,
    );
    return {
      success: true,
      compositeImage: `data:image/png;base64,${result}`,
    };
  }
}
