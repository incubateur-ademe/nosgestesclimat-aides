import { ApiProperty } from "@nestjs/swagger";
import { Besoin } from "../../../../../src/domain/aides/besoin";
import { Aide } from "../../../../domain/aides/aide";
import { Echelle } from "../../../../domain/aides/echelle";
import { Thematique } from "../../../../domain/thematique/thematique";

export class AideAPI {
  @ApiProperty() content_id: string;
  @ApiProperty() titre: string;
  @ApiProperty() contenu: string;
  @ApiProperty({ enum: Echelle }) echelle: Echelle;
  @ApiProperty() url_simulateur: string;
  @ApiProperty() url_source: string;
  @ApiProperty() url_demande: string;
  @ApiProperty() derniere_maj: Date;
  @ApiProperty({ enum: Thematique, enumName: "Thematique", isArray: true })
  thematiques: Thematique[];
  @ApiProperty() montant_max: number;
  @ApiProperty({ enum: Besoin }) besoin: Besoin;
  @ApiProperty() besoin_desc: string;
  @ApiProperty() partenaire_nom: string;
  @ApiProperty() partenaire_url: string;
  @ApiProperty() partenaire_logo_url: string;
  @ApiProperty() est_gratuit: boolean;

  @ApiProperty() question_accroche: string;
  @ApiProperty() introduction: string;
  @ApiProperty() explication: string;
  @ApiProperty() conditions_eligibilite: string;
  @ApiProperty() equipements_eligibles: string;
  @ApiProperty() travaux_eligibles: string;
  @ApiProperty() montant: string;
  @ApiProperty() en_savoir_plus: string;
  @ApiProperty() description_courte: string;

  public static mapToAPI(aide: Aide): AideAPI {
    return {
      content_id: aide.content_id,
      titre: aide.titre,
      contenu: aide.contenu,
      derniere_maj: aide.derniere_maj,
      url_simulateur: aide.url_simulateur,
      url_source: aide.url_source,
      url_demande: aide.url_demande,
      thematiques: aide.thematiques,
      montant_max: aide.montant_max,
      besoin_desc: aide.besoin_desc,
      besoin: aide.besoin,
      partenaire_nom: aide.partenaire_nom,
      partenaire_url: aide.partenaire_url,
      partenaire_logo_url: aide.partenaire_logo_url,
      echelle: Echelle[aide.echelle],
      est_gratuit: aide.est_gratuit,

      question_accroche: aide.question_accroche,
      introduction: aide.introduction,
      explication: aide.explication,
      conditions_eligibilite: aide.conditions_eligibilite,
      equipements_eligibles: aide.equipements_eligibles,
      travaux_eligibles: aide.travaux_eligibles,
      montant: aide.montant,
      en_savoir_plus: aide.en_savoir_plus,
      description_courte: aide.description_courte,
    };
  }
}
