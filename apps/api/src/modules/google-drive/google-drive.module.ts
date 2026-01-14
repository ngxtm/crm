import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { GoogleDriveController } from './google-drive.controller';
import { GoogleDriveService } from './google-drive.service';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
    }),
  ],
  controllers: [GoogleDriveController],
  providers: [GoogleDriveService],
  exports: [GoogleDriveService],
})
export class GoogleDriveModule {}
