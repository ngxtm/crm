import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { GoogleDriveService, UploadResult, DriveFile } from './google-drive.service';
import { CreateFolderDto } from './dto/create-folder.dto';

@ApiTags('Google Drive')
@Controller('google-drive')
export class GoogleDriveController {
  constructor(private readonly googleDriveService: GoogleDriveService) {}

  @Get('status')
  @ApiOperation({ summary: 'Check if Google Drive service is available' })
  getStatus(): { available: boolean } {
    return { available: this.googleDriveService.isAvailable() };
  }

  @Post('folders')
  @ApiOperation({ summary: 'Create a new folder' })
  async createFolder(
    @Body() dto: CreateFolderDto,
  ): Promise<{ folderId: string; webViewLink: string }> {
    return this.googleDriveService.createFolder(dto.name, dto.parentId);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folderId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folderId') folderId?: string,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.googleDriveService.uploadFile(file, folderId);
  }

  @Post('upload-multiple')
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        folderId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folderId') folderId?: string,
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    return Promise.all(
      files.map((file) => this.googleDriveService.uploadFile(file, folderId)),
    );
  }

  @Get('files')
  @ApiOperation({ summary: 'List files in a folder' })
  async listFiles(@Query('folderId') folderId?: string): Promise<DriveFile[]> {
    return this.googleDriveService.listFiles(folderId);
  }

  @Get('files/:fileId')
  @ApiOperation({ summary: 'Get file metadata' })
  async getFile(@Param('fileId') fileId: string): Promise<DriveFile | null> {
    return this.googleDriveService.getFile(fileId);
  }

  @Delete('files/:fileId')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(@Param('fileId') fileId: string): Promise<{ success: boolean }> {
    await this.googleDriveService.deleteFile(fileId);
    return { success: true };
  }
}
