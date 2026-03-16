import { Injectable } from "@nestjs/common";
import { AideDefinition } from "../domain/aides/aideDefinition";
import { Echelle } from "../domain/aides/echelle";
import { BlockTextDefinition } from "../domain/contenu/BlockTextDefinition";
import { PartenaireDefinition } from "../domain/partenaires/partenaireDefinition";
import { Thematique } from "../domain/thematique/thematique";
import { CMSEvent } from "../infrastructure/api/types/cms/CMSEvent";
import { CMSModel } from "../infrastructure/api/types/cms/CMSModels";
import { CMSWebhookAPI } from "../infrastructure/api/types/cms/CMSWebhookAPI";
import { CMSWebhookEntryAPI } from "../infrastructure/api/types/cms/CMSWebhookEntryAPI";
import { CMSWebhookImageURLAPI } from "../infrastructure/api/types/cms/CMSWebhookImageURLAPI";
import { AideRepository } from "../infrastructure/repository/aide.repository";
import { BlockTextRepository } from "../infrastructure/repository/blockText.repository";
import { PartenaireRepository } from "../infrastructure/repository/partenaire.repository";
import { PartenaireUsecase } from "./partenaire.usecase";

@Injectable()
export class CMSWebhookUsecase {
  constructor(
    private aideRepository: AideRepository,
    private partenaireRepository: PartenaireRepository,
    private blockTextRepository: BlockTextRepository,
    private partenaireUsecase: PartenaireUsecase
  ) {}

  async manageIncomingCMSData(cmsWebhookAPI: CMSWebhookAPI) {
    if (cmsWebhookAPI.model === CMSModel.aide) {
      switch (cmsWebhookAPI.event) {
        case CMSEvent["entry.unpublish"]:
          return this.deleteAide(cmsWebhookAPI);
        case CMSEvent["entry.delete"]:
          return this.deleteAide(cmsWebhookAPI);
        case CMSEvent["entry.publish"]:
          return this.createOrUpdateAide(cmsWebhookAPI);
        case CMSEvent["entry.update"]:
          return this.createOrUpdateAide(cmsWebhookAPI);
      }
    }
    if (cmsWebhookAPI.model === CMSModel.text) {
      switch (cmsWebhookAPI.event) {
        case CMSEvent["entry.unpublish"]:
          return this.deleteBlockTexte(cmsWebhookAPI);
        case CMSEvent["entry.delete"]:
          return this.deleteBlockTexte(cmsWebhookAPI);
        case CMSEvent["entry.publish"]:
          return this.createOrUpdateBlockTexte(cmsWebhookAPI);
        case CMSEvent["entry.update"]:
          return this.createOrUpdateBlockTexte(cmsWebhookAPI);
      }
    }
    if (cmsWebhookAPI.model === CMSModel.partenaire) {
      switch (cmsWebhookAPI.event) {
        case CMSEvent["entry.unpublish"]:
          return this.deletePartenaire(cmsWebhookAPI);
        case CMSEvent["entry.delete"]:
          return this.deletePartenaire(cmsWebhookAPI);
        case CMSEvent["entry.publish"]:
          return this.createOrUpdatePartenaire(cmsWebhookAPI);
        case CMSEvent["entry.update"]:
          return this.createOrUpdatePartenaire(cmsWebhookAPI);
      }
    }
  }

  async deleteAide(cmsWebhookAPI: CMSWebhookAPI) {
    await this.aideRepository.delete(cmsWebhookAPI.entry.id.toString());
  }

  async deleteBlockTexte(cmsWebhookAPI: CMSWebhookAPI) {
    await this.blockTextRepository.delete(cmsWebhookAPI.entry.id.toString());
  }
  async deletePartenaire(cmsWebhookAPI: CMSWebhookAPI) {
    await this.partenaireRepository.delete(cmsWebhookAPI.entry.id.toString());
  }

  async createOrUpdateAide(cmsWebhookAPI: CMSWebhookAPI) {
    if (cmsWebhookAPI.entry.publishedAt === null) return;

    const aide_to_upsert = this.buildAideFromCMSData(cmsWebhookAPI.entry);
    await this.aideRepository.upsert(aide_to_upsert);
  }

  async createOrUpdateBlockTexte(cmsWebhookAPI: CMSWebhookAPI) {
    if (cmsWebhookAPI.entry.publishedAt === null) return;

    await this.blockTextRepository.upsert(
      this.buildBlockTexteFromCMSData(cmsWebhookAPI.entry)
    );
  }

  async createOrUpdatePartenaire(cmsWebhookAPI: CMSWebhookAPI) {
    if (cmsWebhookAPI.entry.publishedAt === null) return;

    await this.partenaireRepository.upsert(
      this.buildPartenaireFromCMSData(cmsWebhookAPI.entry)
    );

    await this.partenaireRepository.loadCache();

    const partenaire_id = "" + cmsWebhookAPI.entry.id;
    await this.partenaireUsecase.updateFromPartenaireCodes(
      this.aideRepository,
      partenaire_id
    );
  }

  private getImageUrlFromImageField(image_field: CMSWebhookImageURLAPI) {
    let url = null;
    if (image_field) {
      if (image_field.formats && image_field.formats.thumbnail) {
        url = image_field.formats.thumbnail.url;
      } else {
        url = image_field.url;
      }
    }
    return url;
  }

  private buildAideFromCMSData(entry: CMSWebhookEntryAPI): AideDefinition {
    const result = new AideDefinition({
      content_id: entry.id.toString(),
      titre: entry.titre,
      date_expiration: entry.date_expiration
        ? new Date(entry.date_expiration)
        : null,
      derniere_maj: entry.derniere_maj ? new Date(entry.derniere_maj) : null,
      partenaires_supp_ids: entry.partenaires
        ? entry.partenaires.map((p) => p.id.toString())
        : [],
      thematiques: entry.thematiques
        ? entry.thematiques.map((elem) => Thematique[elem.code])
        : [],
      contenu: entry.description,
      is_simulateur: entry.is_simulation ? true : false,
      montant_max: entry.montantMaximum
        ? Math.round(parseFloat(entry.montantMaximum))
        : null,
      url_simulateur: entry.url_detail_front,
      besoin: entry.besoin ? entry.besoin.code : null,
      besoin_desc: entry.besoin ? entry.besoin.description : null,
      exclude_codes_commune: this.split(entry.exclude_codes_commune),
      echelle: Echelle[entry.echelle],
      url_source: entry.url_source,
      url_demande: entry.url_demande,
      est_gratuit: !!entry.est_gratuit,
      codes_commune_from_partenaire: [],
      codes_departement_from_partenaire: [],
      codes_region_from_partenaire: [],
      VISIBLE_PROD: this.trueIfUndefinedOrNull(entry.VISIBLE_PROD),
      question_accroche: entry.question_accroche,
      introduction: entry.introduction,
      explication: entry.explication,
      conditions_eligibilite: entry.conditions_eligibilite,
      equipements_eligibles: entry.equipements_eligibles,
      travaux_eligibles: entry.travaux_eligibles,
      montant: entry.montant,
      en_savoir_plus: entry.en_savoir_plus,
      description_courte: entry.description_courte,
    });

    const computed =
      this.partenaireUsecase.external_compute_communes_departement_regions_from_liste_partenaires(
        result.partenaires_supp_ids
      );

    result.codes_commune_from_partenaire = computed.codes_commune;
    result.codes_departement_from_partenaire = computed.codes_departement;
    result.codes_region_from_partenaire = computed.codes_region;

    return result;
  }

  private buildPartenaireFromCMSData(
    entry: CMSWebhookEntryAPI
  ): PartenaireDefinition {
    const result = {
      id_cms: entry.id.toString(),
      nom: entry.nom,
      url: entry.lien,
      image_url: this.getImageUrlFromImageField(entry.logo[0]),
      echelle: Echelle[entry.echelle],
      code_commune: entry.code_commune,
      code_departement: entry.code_departement,
      code_region: entry.code_region,
      code_epci: entry.code_epci,
      liste_codes_commune_from_EPCI:
        this.partenaireUsecase.external_compute_communes_from_epci(
          entry.code_epci
        ),
    };

    return result;
  }

  private buildBlockTexteFromCMSData(
    entry: CMSWebhookEntryAPI
  ): BlockTextDefinition {
    return {
      cms_id: entry.id.toString(),
      code: entry.code,
      titre: entry.titre,
      texte: entry.texte,
    };
  }

  private split(list: string) {
    return list ? list.split(",").map((c) => c.trim()) : [];
  }

  private trueIfUndefinedOrNull(value: boolean) {
    if (value === undefined || value === null) return true;
    return value;
  }
}
