import { IsString, IsNotEmpty } from 'class-validator';

export class AnalyzeBagDto {
  @IsString()
  @IsNotEmpty()
  imageBase64: string;

  @IsString()
  @IsNotEmpty()
  prompt: string;
}
