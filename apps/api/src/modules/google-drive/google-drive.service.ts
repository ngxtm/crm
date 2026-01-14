import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

export interface UploadResult {
  fileId: string;
  fileName: string;
  mimeType: string;
  thumbnailUrl: string | null;
  webViewLink: string | null;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailUrl: string | null;
  webViewLink: string | null;
  createdTime: string;
  size: string;
}

@Injectable()
export class GoogleDriveService implements OnModuleInit {
  private drive: drive_v3.Drive;
  private readonly logger = new Logger(GoogleDriveService.name);
  private rootFolderId: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const serviceAccountKey = this.configService.get<string>(
        'GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY',
      );
      this.rootFolderId =
        this.configService.get<string>('GOOGLE_DRIVE_ROOT_FOLDER_ID') || '';

      if (!serviceAccountKey) {
        this.logger.warn(
          'GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY not configured. Google Drive features disabled.',
        );
        return;
      }

      const credentials = JSON.parse(serviceAccountKey);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });

      this.drive = google.drive({ version: 'v3', auth });
      this.logger.log('Google Drive service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Google Drive service', error);
    }
  }

  /**
   * Check if Drive service is available
   */
  isAvailable(): boolean {
    return !!this.drive;
  }

  /**
   * Get thumbnail URL for a file
   */
  getThumbnailUrl(fileId: string, size = 300): string {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
  }

  /**
   * Create a folder in Google Drive
   */
  async createFolder(
    name: string,
    parentId?: string,
  ): Promise<{ folderId: string; webViewLink: string }> {
    if (!this.drive) {
      throw new Error('Google Drive service not initialized');
    }

    const response = await this.drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId || this.rootFolderId],
      },
      fields: 'id, webViewLink',
    });

    return {
      folderId: response.data.id!,
      webViewLink: response.data.webViewLink || null,
    };
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(
    file: Express.Multer.File,
    folderId?: string,
  ): Promise<UploadResult> {
    if (!this.drive) {
      throw new Error('Google Drive service not initialized');
    }

    const stream = new Readable();
    stream.push(file.buffer);
    stream.push(null);

    const response = await this.drive.files.create({
      requestBody: {
        name: file.originalname,
        parents: [folderId || this.rootFolderId],
      },
      media: {
        mimeType: file.mimetype,
        body: stream,
      },
      fields: 'id, name, mimeType, webViewLink',
    });

    const fileId = response.data.id!;

    // Make file publicly viewable for thumbnail access
    await this.drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const isImage = file.mimetype.startsWith('image/');

    return {
      fileId,
      fileName: response.data.name!,
      mimeType: response.data.mimeType!,
      thumbnailUrl: isImage ? this.getThumbnailUrl(fileId) : null,
      webViewLink: response.data.webViewLink || null,
    };
  }

  /**
   * List files in a folder
   */
  async listFiles(folderId?: string): Promise<DriveFile[]> {
    if (!this.drive) {
      throw new Error('Google Drive service not initialized');
    }

    const response = await this.drive.files.list({
      q: `'${folderId || this.rootFolderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, createdTime, size)',
      orderBy: 'createdTime desc',
    });

    return (response.data.files || []).map((file) => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      thumbnailUrl: file.mimeType?.startsWith('image/')
        ? this.getThumbnailUrl(file.id!)
        : null,
      webViewLink: file.webViewLink || null,
      createdTime: file.createdTime || '',
      size: file.size || '0',
    }));
  }

  /**
   * Delete a file from Google Drive
   */
  async deleteFile(fileId: string): Promise<void> {
    if (!this.drive) {
      throw new Error('Google Drive service not initialized');
    }

    await this.drive.files.delete({ fileId });
  }

  /**
   * Get file metadata
   */
  async getFile(fileId: string): Promise<DriveFile | null> {
    if (!this.drive) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, webViewLink, createdTime, size',
      });

      const file = response.data;
      return {
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        thumbnailUrl: file.mimeType?.startsWith('image/')
          ? this.getThumbnailUrl(file.id!)
          : null,
        webViewLink: file.webViewLink || null,
        createdTime: file.createdTime || '',
        size: file.size || '0',
      };
    } catch {
      return null;
    }
  }
}
