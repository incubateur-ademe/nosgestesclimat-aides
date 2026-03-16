import {
  AideExpirationWarning,
  BlockText,
  Partenaire,
  Aide,
} from "../generated/prisma/client";
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { Besoin } from "../src/domain/aides/besoin";
import { Echelle } from "../src/domain/aides/echelle";
import { Thematique } from "../src/domain/thematique/thematique";
import { CMSEvent } from "../src/infrastructure/api/types/cms/CMSEvent";
import { CMSModel } from "../src/infrastructure/api/types/cms/CMSModels";
import { PrismaService } from "../src/infrastructure/prisma/prisma.service";
import { AideRepository } from "../src/infrastructure/repository/aide.repository";
import { BlockTextRepository } from "../src/infrastructure/repository/blockText.repository";
import { PartenaireRepository } from "../src/infrastructure/repository/partenaire.repository";

export enum DB {
  CMSWebhookAPI = "CMSWebhookAPI",
  aide = "aide",
  blockText = "blockText",
  partenaire = "partenaire",
  aideExpirationWarning = "aideExpirationWarning",
}

export class TestUtil {
  private static TYPE_DATA_MAP = {
    CMSWebhookAPI: TestUtil.CMSWebhookAPIData,
    aide: TestUtil.aideData,
    partenaire: TestUtil.partenaireData,
    blockText: TestUtil.blockTextData,
    aideExpirationWarning: TestUtil.aideExpirationWarningData,
  };

  constructor() {}
  public static ok_appclose = true;
  public static app: INestApplication;
  public static prisma = new PrismaService();
  public static utilisateur = "utilisateur";
  public static token = "123456";

  static getServer() {
    return request(this.app.getHttpServer());
  }

  static GET(url: string) {
    return TestUtil.getServer()
      .get(url)
      .set("Authorization", `Bearer ${TestUtil.token}`);
  }
  static PUT(url: string) {
    return TestUtil.getServer()
      .put(url)
      .set("Authorization", `Bearer ${TestUtil.token}`);
  }
  static PATCH(url: string) {
    return TestUtil.getServer()
      .patch(url)
      .set("Authorization", `Bearer ${TestUtil.token}`);
  }
  static DELETE(url: string) {
    return TestUtil.getServer()
      .delete(url)
      .set("Authorization", `Bearer ${TestUtil.token}`);
  }
  static POST(url: string) {
    return TestUtil.getServer()
      .post(url)
      .set("Authorization", `Bearer ${TestUtil.token}`);
  }

  static async appinit() {
    if (TestUtil.app === undefined) {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      TestUtil.app = moduleFixture.createNestApplication();
      await TestUtil.app.init();
    }
  }
  static async appclose() {
    if (TestUtil.ok_appclose) {
      await this.app.close();
      await this.prisma.client.$disconnect();
    }
  }

  static async deleteAll() {
    await this.prisma.client.aide.deleteMany();
    await this.prisma.client.partenaire.deleteMany();
    await this.prisma.client.aideExpirationWarning.deleteMany();
    await this.prisma.client.blockText.deleteMany();

    BlockTextRepository.resetCache();
    PartenaireRepository.resetCache();
    AideRepository.resetCache();
  }

  static getDate(date: string) {
    return new Date(Date.parse(date));
  }

  static async create<K extends keyof typeof TestUtil.TYPE_DATA_MAP>(
    type: K,
    override?: // NOTE: Assumes function has only one parameter
    Parameters<(typeof TestUtil.TYPE_DATA_MAP)[K]>[0]
  ) {
    await this.prisma.client[type as string].create({
      data: (TestUtil.TYPE_DATA_MAP[type as DB] as Function)(override),
    });
  }

  static CMSWebhookAPIData() {
    return {
      model: CMSModel.article,
      event: CMSEvent["entry.publish"],
      entry: {
        id: 123,
        titre: "titre",
        sousTitre: "soustitre 222",
        thematique_principale: {
          id: 1,
          titre: "Alimentation",
          code: Thematique.alimentation,
        },
        thematiques: [
          { id: 1, titre: "Alimentation", code: Thematique.alimentation },
          { id: 2, titre: "Climat", code: Thematique.climat },
        ],
        rubriques: [
          { id: 1, titre: "A" },
          { id: 2, titre: "B" },
        ],
        partenaire: {
          id: 1,
          nom: "Angers Loire Métropole",
          lien: "https://www.angersloiremetropole.fr/",
        },
        source: "La source",
        duree: "pas trop long",
        frequence: "souvent",
        imageUrl: {
          formats: {
            thumbnail: { url: "https://" },
          },
        },
        difficulty: 3,
        points: 20,
        codes_postaux: "91120,75002",
        publishedAt: new Date("2023-09-20T14:42:12.941Z"),
      },
    };
  }

  static aideData(override?: Partial<Aide>): Aide {
    return {
      content_id: "1",
      titre: "titreA",
      date_expiration: null,
      derniere_maj: null,
      partenaires_supp_ids: [],
      thematiques: [Thematique.climat, Thematique.logement],
      contenu: "Contenu de l'aide",
      is_simulateur: true,
      montant_max: 999,
      url_simulateur: "/aides/velo",
      created_at: undefined,
      updated_at: undefined,
      besoin: Besoin.acheter_velo,
      besoin_desc: "Acheter un vélo",
      exclude_codes_commune: [],
      echelle: Echelle.National,
      url_source: "https://hello",
      url_demande: "https://demande",
      codes_commune_from_partenaire: [],
      codes_departement_from_partenaire: [],
      codes_region_from_partenaire: [],
      est_gratuit: false,
      VISIBLE_PROD: true,
      question_accroche: "A",
      introduction: "B",
      explication: "C",
      conditions_eligibilite: "D",
      equipements_eligibles: "E",
      travaux_eligibles: "F",
      montant: "G",
      en_savoir_plus: "H",
      description_courte: "I",

      ...override,
    };
  }

  static partenaireData(override?: Partial<Partenaire>): Partenaire {
    return {
      content_id: "123",
      image_url: "logo_url",
      nom: "ADEME",
      url: "https://ademe.fr",
      code_commune: "001",
      code_epci: "002",
      echelle: Echelle.National,
      liste_communes_calculees: [],
      code_departement: undefined,
      code_region: undefined,
      created_at: undefined,
      updated_at: undefined,
      ...override,
    };
  }

  static blockTextData(override?: Partial<BlockText>): BlockText {
    return {
      id_cms: "123",
      code: "456",
      titre: "titre",
      texte: "texte",
      created_at: undefined,
      updated_at: undefined,
      ...override,
    };
  }
  static aideExpirationWarningData(
    override?: Partial<AideExpirationWarning>
  ): AideExpirationWarning {
    return {
      aide_cms_id: "123",
      expired: false,
      expired_sent: false,
      last_month: false,
      last_month_sent: false,
      last_week: false,
      last_week_sent: false,
      created_at: undefined,
      updated_at: undefined,
      ...override,
    };
  }

  static CODE_COMMUNE_FROM_PARTENAIRE = [
    "91477",
    "21231",
    "21166",
    "21617",
    "21171",
    "21515",
    "21278",
    "21355",
    "21540",
    "21390",
    "21452",
    "21485",
    "21481",
    "21605",
    "21263",
    "21003",
    "21223",
    "21473",
    "21315",
    "21105",
    "21106",
    "21370",
    "21192",
    "21270",
  ];
}
