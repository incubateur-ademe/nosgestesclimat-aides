import { Injectable } from "@nestjs/common";
import { Aide } from "../domain/aides/aide";
import { ApplicationError } from "../infrastructure/applicationError";
import { AideRepository } from "../infrastructure/repository/aide.repository";
import { PartenaireRepository } from "../infrastructure/repository/partenaire.repository";
import { CMSImportUsecase } from "./cms.import.usecase";
import { Personnalisator } from "../infrastructure/personnalisator";

@Injectable()
export class CmsPreviewUsecase {
  constructor(
    private aideRepository: AideRepository,
    private cMSImportUsecase: CMSImportUsecase,
    private personnalisator: Personnalisator
  ) {}

  async getAidePreviewByIdCMS(
    cms_id: string
  ): Promise<{ data: object; aide: Aide }> {
    const aide_def = await this.cMSImportUsecase.getAideFromCMS(cms_id);

    if (!aide_def) {
      ApplicationError.throwAideNotFound(cms_id);
    }

    const aide = new Aide(aide_def);
    const liste_part = PartenaireRepository.getPartenaires(
      aide.partenaires_supp_ids
    );
    aide.setPartenairePourUtilisateur(null, liste_part);

    return { data: {}, aide: this.personnalisator.personnaliser(aide) };
  }
}
