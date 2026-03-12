import { Module } from "@nestjs/common";
import { PrismaService } from "./infrastructure/prisma/prisma.service";
import { AideRepository } from "./infrastructure/repository/aide.repository";
import { PartenaireRepository } from "./infrastructure/repository/partenaire.repository";
import { BlockTextRepository } from "./infrastructure/repository/blockText.repository";
import { CommuneRepository } from "./infrastructure/repository/commune/commune.repository";
import { AideExpirationWarningRepository } from "./infrastructure/repository/aideExpirationWarning.repository";
import { AidesController } from "./infrastructure/api/aides.controller";
import { LoadCMSController } from "./infrastructure/api/loadCMS.controller";
import { AidesUsecase } from "./usecase/aides.usecase";
import { CMSImportUsecase } from "./usecase/cms.import.usecase";
import { CMSWebhookUsecase } from "./usecase/cms.webhook.usecase";
import { PartenaireUsecase } from "./usecase/partenaire.usecase";
import { EmailSender } from "./infrastructure/email/emailSender";
import { Personnalisator } from "./infrastructure/personnalisator";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 1000 * 60 * 60 * 24,
        limit: 10000,
      },
    ]),
  ],
  controllers: [AidesController, LoadCMSController],
  providers: [
    PrismaService,
    AideRepository,
    AideExpirationWarningRepository,
    PartenaireRepository,
    BlockTextRepository,
    CommuneRepository,
    AidesUsecase,
    CMSImportUsecase,
    CMSWebhookUsecase,
    PartenaireUsecase,
    EmailSender,
    Personnalisator,
  ],
})
export class AppModule {}
