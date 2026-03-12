import { Controller, Post, Request } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { CMSImportUsecase } from "../../usecase/cms.import.usecase";
import { GenericControler } from "./genericControler";

@Controller()
@ApiTags("Z - Load CMS")
@ApiBearerAuth()
export class LoadCMSController extends GenericControler {
  constructor(private cmsUsecase: CMSImportUsecase) {
    super();
  }

  @Post("/admin/load_partenaires_from_cms")
  @ApiOperation({
    summary: "Upsert tous les partenaires publiés du CMS",
  })
  @ApiOkResponse({ type: [String] })
  async load_partenaires_from_cms(@Request() req): Promise<string[]> {
    this.checkAPIProtectedEndpoint(req);
    return await this.cmsUsecase.loadPartenairesFromCMS();
  }

  @Post("/admin/load_blocktexte_from_cms")
  @ApiOperation({
    summary: "Upsert tous les block de textes publiés du CMS",
  })
  @ApiOkResponse({ type: [String] })
  async load_blocktexte_from_cms(@Request() req): Promise<string[]> {
    this.checkAPIProtectedEndpoint(req);
    return await this.cmsUsecase.loadBlockTexteFromCMS();
  }

  @Post("/admin/load_aides_from_cms")
  @ApiOperation({
    summary: "Upsert toures les aides publiés du CMS",
  })
  @ApiOkResponse({ type: [String] })
  async upsertAllCMSaides(@Request() req): Promise<string[]> {
    this.checkAPIProtectedEndpoint(req);
    return await this.cmsUsecase.loadAidesFromCMS();
  }
}
