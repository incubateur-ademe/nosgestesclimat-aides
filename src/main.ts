import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Exposition Swagger
  const swaggerDocumentOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      tryItOutEnabled: false,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
  };
  const config = new DocumentBuilder()
    .setTitle(`Référentiel d'aides à la transition écologique`)
    .setDescription(
      `Doc API executable, tous les endpoints sont testables en conditions réelles`
    )
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document, swaggerDocumentOptions);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
