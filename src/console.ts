import { INestApplicationContext } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AidesUsecase } from "./usecase/aides.usecase";

export const appCommands: Record<
  string,
  (app: INestApplicationContext, ...args: string[]) => Promise<any>
> = {
  aide_expired_soon: async (app) => {
    return await app.get(AidesUsecase).reportAideSoonExpired();
  },
  aide_expired_soon_emails: async (app) => {
    return await app.get(AidesUsecase).envoyerEmailsAideExpiration();
  },
};

async function bootstrap() {
  const application = await NestFactory.createApplicationContext(AppModule);

  const command = process.argv[2];
  if (command in appCommands) {
    let start_time = Date.now();

    console.log(`START ${command} ${start_time}`);
    const args = process.argv.slice(3);
    const res = await appCommands[command](application, ...args);
    console.log(`STOP ${command} after ${Date.now() - start_time} ms`);
    console.log("Result:", res);

    await application.close();
    process.exit(0);
  } else {
    console.log("Command not found");
    process.exit(1);
  }
}

bootstrap();
