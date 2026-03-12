import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { AidesUsecase } from "../../usecase/aides.usecase";
import { GenericControler } from "./genericControler";
import { AideAPI } from "./types/aide/AideAPI";

@Controller()
@ApiBearerAuth()
@ApiTags("Aides")
export class AidesController extends GenericControler {
  constructor(private readonly aidesUsecase: AidesUsecase) {
    super();
  }

  /*
  @ApiOkResponse({ type: CatalogueAideAPI })
  @ApiQuery({
    name: "thematique",
    enum: Thematique,
    enumName: "thematique",
    isArray: true,
    required: false,
    description: `filtrage par thematiques, plusieurs thematiques possible avec la notation ?thematique=XXX&thematique=YYY`,
  })
  @Get("utilisateurs/:utilisateurId/aides_v2")
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 1000 } })
  async getCatalogueAides_v2(
    @Param("utilisateurId") utilisateurId: string,
    @Query("thematique") thematique: string[] | string,
    @Request() req
  ): Promise<CatalogueAideAPI> {
    this.checkCallerId(req, utilisateurId);
    const liste_thematiques_input =
      this.getStringListFromStringArrayAPIInput(thematique);

    const liste_thematiques: Thematique[] = [];

    for (const them_string of liste_thematiques_input) {
      liste_thematiques.push(this.castThematiqueOrException(them_string));
    }
    const aides = await this.aidesUsecase.getCatalogueAidesUtilisateur(
      utilisateurId,
      liste_thematiques
    );
    return CatalogueAideAPI.mapToAPI(aides.aides, aides.utilisateur);
  }
    */

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 1000 } })
  @ApiOkResponse({ type: AideAPI })
  @Get("aides/:aideId")
  async getAideUnique(
    @Param("aideId") aideId: string,
    @Request() req
  ): Promise<AideAPI> {
    const aide = await this.aidesUsecase.getOfflineAideUniqueByIdCMS(aideId);
    return AideAPI.mapToAPI(aide);
  }
}
