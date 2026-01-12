import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CompositeBagDto {
  @IsString()
  @IsNotEmpty()
  designImageBase64: string;

  @IsString()
  @IsNotEmpty()
  bagImageBase64: string;

  @IsString()
  @IsOptional()
  customPrompt?: string;
}
