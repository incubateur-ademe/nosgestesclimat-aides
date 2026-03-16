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

@Controller()
@ApiBearerAuth()
@ApiTags("Aides")
export class AidesController extends GenericControler {
  constructor(private readonly aidesUsecase: AidesUsecase) {
    super();
  }

  @ApiOkResponse({ type: [AideAPI] })
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
    description: `Code insee de la commune de l'utilisateur`,
  })
  @ApiQuery({
    name: "code_postal",
    required: false,
    description: `Code postal de l'utilisateur`,
  })
  @Get("aides")
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 1000 } })
  async getCatalogueAides_v2(
    @Query("thematique") thematique: string[] | string,
    @Query("code_commune") code_commune: string,
    @Query("code_postal") code_postal: string,
    @Request() req
  ): Promise<AideAPI[]> {
    this.checkAPIProtectedEndpoint(req);
    const liste_thematiques_input =
      this.getStringListFromStringArrayAPIInput(thematique);

    const liste_thematiques: Thematique[] = [];

    for (const them_string of liste_thematiques_input) {
      liste_thematiques.push(this.castThematiqueOrException(them_string));
    }
    const aides = await this.aidesUsecase.getCatalogueAides(
      code_commune,
      code_postal,
      liste_thematiques
    );
    return aides.map((a) => AideAPI.mapToAPI(a));
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 1000 } })
  @ApiOkResponse({ type: AideAPI })
  @Get("aides/:aideId")
  async getAideUnique(
    @Param("aideId") aideId: string,
    @Request() req
  ): Promise<AideAPI> {
    this.checkAPIProtectedEndpoint(req);
    const aide = await this.aidesUsecase.getAideById(aideId);
    return AideAPI.mapToAPI(aide);
  }
}
