import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  // Increase body size limit for large image uploads (50MB)
  app.use(require('express').json({ limit: '50mb' }));
  app.use(require('express').urlencoded({ limit: '50mb', extended: true }));

  // Enable CORS
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3002',
    process.env.FRONTEND_URL, // Set this on Render
  ].filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('CRM API')
    .setDescription('CRM Lead Management API Documentation')
    .setVersion('1.0')
    .addTag('lead-sources')
    .addTag('campaigns')
    .addTag('leads')
    .addTag('webhooks')
    .addTag('sales-employees')
    .addTag('product-groups')
    .addTag('assignment')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs on http://localhost:${port}/api/docs`);
}
bootstrap();
