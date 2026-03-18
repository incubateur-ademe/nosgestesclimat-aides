import { Injectable } from "@nestjs/common";

import { Aide } from "../domain/aides/aide";
import { AideFilter } from "../domain/aides/aideFilter";
import { Echelle } from "../domain/aides/echelle";
import { App } from "../domain/app";
import { Thematique } from "../domain/thematique/thematique";
import { ApplicationError } from "../infrastructure/applicationError";
import { AideRepository } from "../infrastructure/repository/aide.repository";
import { AideExpirationWarningRepository } from "../infrastructure/repository/aideExpirationWarning.repository";
import { CommuneRepository } from "../infrastructure/repository/commune/commune.repository";
import { PartenaireRepository } from "../infrastructure/repository/partenaire.repository";
import { PartenaireUsecase } from "./partenaire.usecase";
import { Personnalisator } from "../infrastructure/personnalisator";
import { EmailSender } from "../infrastructure/email/emailSender";
import { Besoin } from "../domain/aides/besoin";

@Injectable()
export class AidesUsecase {
  constructor(
    private aideExpirationWarningRepository: AideExpirationWarningRepository,
    private aideRepository: AideRepository,
    private communeRepository: CommuneRepository,
    private partenaireUsecase: PartenaireUsecase,
    private personnalisator: Personnalisator,
    private emailSender: EmailSender
  ) {}

  async getCatalogueAides(
    code_commune: string,
    code_postal: string,
    filtre_thematiques: Thematique[],
    besoin: Besoin
  ): Promise<Aide[]> {
    if (code_commune && code_postal) {
      ApplicationError.throwCodePostalOuCodeCommune();
    }
    const filtre: AideFilter = {
      date_expiration: new Date(),
      thematiques: filtre_thematiques,
    };

    if (besoin) {
      filtre.besoins = [besoin];
    }

    if (code_commune) {
      const commune =
        this.communeRepository.getCommuneByCodeINSEESansArrondissement(
          code_commune
        );
      if (!commune) {
        ApplicationError.throwCodeCommuneNotFound(code_commune);
      }
      filtre.code_commune = [commune.code];
    }

    if (code_postal) {
      const communes =
        this.communeRepository.listeCodesCommunesByCodePostal(code_postal);
      if (communes.length === 0) {
        ApplicationError.throwCodePostalNotFound(code_postal);
      }
      filtre.code_commune = communes;
    }

    const aide_def_liste = await this.aideRepository.search(filtre);

    const aides_nationales: Aide[] = [];
    const aides_locales: Aide[] = [];
    for (const aide_def of aide_def_liste) {
      const aide = Aide.newAide(aide_def);
      this.setPartenaire(aide, code_commune);
      if (aide_def.echelle === Echelle.National) {
        aides_nationales.push(aide);
      } else {
        aides_locales.push(aide);
      }
    }

    return this.personnalisator.personnaliser(
      aides_nationales.concat(aides_locales)
    );
  }

  async getAideById(cms_id: string): Promise<Aide> {
    const aide_def = this.aideRepository.getAide(cms_id);

    if (!aide_def) {
      ApplicationError.throwAideNotFound(cms_id);
    }

    const aide = new Aide(aide_def);
    this.setPartenaire(aide, null);

    return this.personnalisator.personnaliser(aide);
  }

  public async reportAideSoonExpired(): Promise<string[]> {
    const result = [];
    const liste_aide_all = await this.aideRepository.listeAll();

    const day = 1000 * 60 * 60 * 24;
    const week = day * 7;
    const month = day * 30;

    const NOW = Date.now();

    for (const aide of liste_aide_all) {
      if (aide.date_expiration) {
        const month_warning = aide.date_expiration.getTime() - month < NOW;
        const week_warning = aide.date_expiration.getTime() - week < NOW;
        const expired = aide.date_expiration.getTime() < NOW;

        if (month_warning || week_warning || expired) {
          await this.aideExpirationWarningRepository.upsert({
            aide_cms_id: aide.content_id,
            last_month: month_warning,
            last_week: week_warning,
            expired: expired,
          });
          result.push(
            `SET : ${aide.content_id}:Month[${month_warning}]Week[${week_warning}]Expired[${expired}]`
          );
        } else {
          await this.aideExpirationWarningRepository.delete(aide.content_id);
          result.push(`REMOVED : ${aide.content_id}`);
        }
      }
    }
    return result;
  }

  public async envoyerEmailsAideExpiration(): Promise<string[]> {
    const result: string[] = [];

    const liste_expirations =
      await this.aideExpirationWarningRepository.get_all();

    for (const aide_exp of liste_expirations) {
      if (aide_exp.last_month && !aide_exp.last_month_sent) {
        await this.sent_aide_expiration_emails("month", aide_exp.aide_cms_id);
        result.push(`month:${aide_exp.aide_cms_id}`);
      }
      if (aide_exp.last_week && !aide_exp.last_week_sent) {
        await this.sent_aide_expiration_emails("week", aide_exp.aide_cms_id);
        result.push(`week:${aide_exp.aide_cms_id}`);
      }
      if (aide_exp.expired && !aide_exp.expired_sent) {
        await this.sent_aide_expiration_emails("expired", aide_exp.aide_cms_id);
        result.push(`expired:${aide_exp.aide_cms_id}`);
      }
    }
    return result;
  }

  public async updateAllPartenairesCodes(block_size = 100) {
    await this.partenaireUsecase.updateAllFromPartenaireCodes(
      this.aideRepository,
      block_size
    );
  }

  async external_count_aides(
    code_commune: string,
    thematique?: Thematique,
    besoins?: string[]
  ): Promise<number> {
    const filtre: AideFilter = {
      code_commune: [code_commune],
      thematiques: thematique ? [thematique] : undefined,
      besoins: besoins,
    };

    return await this.aideRepository.count(filtre);
  }

  private setPartenaire(aide: Aide, code_commune: string) {
    const liste_part = PartenaireRepository.getPartenaires(
      aide.partenaires_supp_ids
    );
    aide.setPartenairePourUtilisateur(code_commune, liste_part);
  }

  private async sent_aide_expiration_emails(
    type: "month" | "week" | "expired",
    id: string
  ) {
    const liste_emails = App.listEmailsWarningAideExpiration();
    for (const email of liste_emails) {
      if (type === "month") {
        const sent_email = await this.emailSender.sendEmail(
          email,
          "Admin",
          `Bonjour oh toi grande prêtresse des Z !
<br>
<br>Sache que j'ai trouvé l'aide <a href="${App.getCmsAidePreviewURL()}/${id}">numéro ${id}</a> qui va expirer dans moins de 1 mois 🧐
<br>
<br>je pense que cela peut t'intéresser
<br>
<br>Je te souhaite une bien bonne journée`,
          `L'aide d'id ${id} va expirer dans 1 mois`
        );
        if (sent_email) {
          await this.aideExpirationWarningRepository.upsert({
            aide_cms_id: id,
            last_month_sent: true,
          });
        }
      }
      if (type === "week") {
        const sent_email = await this.emailSender.sendEmail(
          email,
          "Admin",
          `Bonjour oh toi grande prêtresse des Z !
<br>
<br>Je veux pas te stresser plus que cela, mais l'aide <a href="${App.getCmsAidePreviewURL()}/${id}">numéro ${id}</a> va expirer dans moins de 1 semaine 😱
<br>
<br>je pense qu'il est VRAIMENT temps de faire quelque chose...
<br>
<br>Je te souhaite néanmoins une bien bonne journée`,
          `L'aide d'id ${id} va expirer dans 1 semaine`
        );
        if (sent_email) {
          await this.aideExpirationWarningRepository.upsert({
            aide_cms_id: id,
            last_week_sent: true,
          });
        }
      }
      if (type === "expired") {
        const sent_email = await this.emailSender.sendEmail(
          email,
          "Admin",
          `Bonjour oh toi grande prêtresse des Z !
<br>
<br>Je ne sais pas si c'est voulu, mais l'aide <a href="${App.getCmsAidePreviewURL()}/${id}">numéro ${id}</a> est belle et bien <strong>expirée</strong> 😭, par mesure de précaution j'ai décidé de ne plus la rendre visible sur le service jusqu'à nouvel ordre.
<br>
<br>Je ne veux pas juger, mais son altesse a quand même un peu échoué dans sa mission de maintenir l'ordre dans le royaume....
<br>
<br>Je te souhaite que cette journée finisse mieux qu'elle n'a commencé...`,
          `L'aide d'id ${id} est expirée et supprimée du catalogue utilisateur`
        );
        if (sent_email) {
          await this.aideExpirationWarningRepository.upsert({
            aide_cms_id: id,
            expired_sent: true,
          });
        }
      }
    }
  }
}
