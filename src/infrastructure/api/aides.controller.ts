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
import { Thematique } from "../../domain/thematique/thematique";
import { Besoin } from "../../domain/aides/besoin";

@Controller()
@ApiBearerAuth()
@ApiTags("Aides")
export class AidesController extends GenericControler {
  constructor(private readonly aidesUsecase: AidesUsecase) {
    super();
  }

  @ApiOkResponse({ type: [AideAPI] })
  @ApiOperation({
    summary: `Renvoie une liste d'aides fonction de paramètres de filtrage.`,
    description:
      "Est obligatoire soit un code commune, soit un code postal, le reste est optionnel",
  })
  @ApiQuery({
    name: "thematique",
    enum: Thematique,
    enumName: "thematique",
    isArray: true,
    required: false,
    description: `filtrage par thematiques, plusieurs thematiques possible avec la notation ?thematique=XXX&thematique=YYY`,
  })
  @ApiQuery({
    name: "code_commune",
    required: false,
    description: `Code INSEE de la commune de l'utilisateur`,
  })
  @ApiQuery({
    name: "code_postal",
    required: false,
    description: `Code postal de l'utilisateur`,
  })
  @ApiQuery({
    name: "besoin",
    enum: Besoin,
    required: false,
    description: `besoin qui regroupe plusieurs aides, par exemple "composter"`,
  })
  @Get("aides")
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 25, ttl: 1000 } })
  async getCatalogueAides_v2(
    @Query("thematique") thematique: string[] | string,
    @Query("code_commune") code_commune: string,
    @Query("code_postal") code_postal: string,
    @Query("besoin") besoin: string,
    @Request() req
  ): Promise<AideAPI[]> {
    this.checkAPIProtectedEndpoint(req);
    const liste_thematiques_input =
      this.getStringListFromStringArrayAPIInput(thematique);

    const liste_thematiques: Thematique[] = [];

    for (const them_string of liste_thematiques_input) {
      liste_thematiques.push(this.castThematiqueOrException(them_string));
    }

    const code_besoin = this.castBesoin(besoin);

    const aides = await this.aidesUsecase.getCatalogueAides(
      code_commune,
      code_postal,
      liste_thematiques,
      code_besoin
    );
    return aides.map((a) => AideAPI.mapToAPI(a));
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 25, ttl: 1000 } })
  @ApiOkResponse({ type: AideAPI })
  @Get("aides/:aideId")
  @ApiOperation({
    summary: `Renvoie une aide unique par son ID`,
  })
  async getAideUnique(
    @Param("aideId") aideId: string,
    @Request() req
  ): Promise<AideAPI> {
    this.checkAPIProtectedEndpoint(req);
    const aide = await this.aidesUsecase.getAideById(aideId);
    return AideAPI.mapToAPI(aide);
  }
}
