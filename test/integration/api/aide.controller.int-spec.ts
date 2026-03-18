import { Besoin } from "../../../src/domain/aides/besoin";
import { Echelle } from "../../../src/domain/aides/echelle";
import { Thematique } from "../../../src/domain/thematique/thematique";
import { AideAPI } from "../../../src/infrastructure/api/types/aide/AideAPI";
import { AideRepository } from "../../../src/infrastructure/repository/aide.repository";
import { BlockTextRepository } from "../../../src/infrastructure/repository/blockText.repository";
import { PartenaireRepository } from "../../../src/infrastructure/repository/partenaire.repository";
import { DB, TestUtil } from "../../TestUtil";

describe("Aide (API test)", () => {
  const OLD_ENV = process.env;
  let blockTextRepository = new BlockTextRepository(TestUtil.prisma);
  const partenaireRepository = new PartenaireRepository(TestUtil.prisma);
  const aideRepository = new AideRepository(TestUtil.prisma);

  beforeAll(async () => {
    await TestUtil.appinit();
  });

  beforeEach(async () => {
    process.env = { ...OLD_ENV }; // Make a copy
    await TestUtil.deleteAll();
  });

  afterAll(async () => {
    process.env = OLD_ENV;
    await TestUtil.appclose();
  });

  it("GET /aides => 401 si pas d'API key", async () => {
    // GIVEN
    // WHEN
    const response = await TestUtil.getServer().get("/aides");

    // THEN
    expect(response.status).toBe(401);
  });
  it("GET /aides => 403 si mauvaise API key", async () => {
    // GIVEN
    process.env.API_KEY = "999999";
    TestUtil.token = "12345";

    // WHEN
    const response = await TestUtil.GET("/aides");

    // THEN
    expect(response.status).toBe(403);
  });
  it("GET /aides => code postal ou commune obligatoire", async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    // WHEN
    const response = await TestUtil.GET("/aides");

    // THEN
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Un code postal ou un code commune doit être saisi"
    );
  });
  it("GET /aides", async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    await TestUtil.create(DB.partenaire);
    await partenaireRepository.loadCache();

    await TestUtil.create(DB.aide, {
      partenaires_supp_ids: ["123"],
      codes_commune_from_partenaire: ["21231"],
    });

    // WHEN
    const response = await TestUtil.GET("/aides?code_commune=21231");

    // THEN
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);

    const aideBody = response.body[0] as AideAPI;
    expect(aideBody.content_id).toEqual("1");
    expect(aideBody.contenu).toEqual("Contenu de l'aide");
    expect(aideBody.echelle).toEqual(Echelle.National);
    expect(aideBody.url_source).toEqual("https://hello");
    expect(aideBody.url_demande).toEqual("https://demande");
    expect(aideBody.partenaire_nom).toEqual("ADEME");
    expect(aideBody.partenaire_url).toEqual("https://ademe.fr");
    expect(aideBody.partenaire_logo_url).toEqual("logo_url");
    expect(aideBody.montant_max).toEqual(999);
    expect(aideBody.thematiques).toEqual([
      Thematique.climat,
      Thematique.logement,
    ]);
    expect(aideBody.titre).toEqual("titreA");
    expect(aideBody.url_simulateur).toEqual("/aides/velo");
    expect(aideBody.besoin).toEqual(Besoin.acheter_velo);
    expect(aideBody.besoin_desc).toEqual("Acheter un vélo");
    expect(aideBody.est_gratuit).toEqual(false);
  });

  it(`GET /aides n'affiche pas une aide en PROD si flag non visible`, async () => {
    // GIVEN
    process.env.IS_PROD = "true";
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    await partenaireRepository.loadCache();

    await TestUtil.create(DB.aide, {
      content_id: "1",
      VISIBLE_PROD: true,
      codes_commune_from_partenaire: ["21231"],
    });
    await TestUtil.create(DB.aide, {
      content_id: "2",
      VISIBLE_PROD: false,
      codes_commune_from_partenaire: ["21231"],
    });

    // WHEN
    const response = await TestUtil.GET("/aides?code_commune=21231");

    // THEN
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);

    expect(response.body[0].content_id).toEqual("1");
  });
  it(`GET /aides affiche toutes les aides en DEV`, async () => {
    // GIVEN
    process.env.IS_PROD = "false";
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    await partenaireRepository.loadCache();

    await TestUtil.create(DB.aide, {
      content_id: "1",
      VISIBLE_PROD: true,
      codes_commune_from_partenaire: ["21231"],
    });
    await TestUtil.create(DB.aide, {
      content_id: "2",
      VISIBLE_PROD: false,
      codes_commune_from_partenaire: ["21231"],
    });

    // WHEN
    const response = await TestUtil.GET("/aides?code_commune=21231");

    // THEN
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it(`GET /aides filtrage par code postal ET commune impossible`, async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    // WHEN
    const response = await TestUtil.GET(
      "/aides?code_postal=21000&code_commune=11111"
    );

    // THEN
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(
      "Impossible de renseigner en même temps un code postal ET un code commune"
    );
  });
  it(`GET /aides code commune inconnu`, async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    // WHEN
    const response = await TestUtil.GET("/aides?code_commune=12345");

    // THEN
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(
      "le code INSEE de commune [12345] n'existe pas"
    );
  });

  it(`GET /aides code postal inconnu`, async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    // WHEN
    const response = await TestUtil.GET("/aides?code_postal=99999");

    // THEN
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(
      "le code postal [99999] n'existe pas"
    );
  });

  it(`GET /aides filtrage par code postal avec commune unique`, async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    await TestUtil.create(DB.aide, {
      content_id: "1",
      codes_commune_from_partenaire: ["21231"],
    });
    await TestUtil.create(DB.aide, {
      content_id: "2",
      codes_commune_from_partenaire: ["11111"],
    });

    // WHEN
    const response = await TestUtil.GET("/aides?code_postal=21000");

    // THEN
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].content_id).toEqual("1");
  });

  it(`GET /aides filtrage par code postal avec multi communes`, async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    await TestUtil.create(DB.aide, {
      content_id: "1",
      codes_commune_from_partenaire: ["54169"],
    });
    await TestUtil.create(DB.aide, {
      content_id: "2",
      codes_commune_from_partenaire: ["54394"],
    });

    // WHEN
    const response = await TestUtil.GET("/aides?code_postal=54490");

    // THEN
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it(`GET /aides filtrage par code commune via partenaires `, async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    await TestUtil.create(DB.aide, {
      content_id: "1",
      codes_commune_from_partenaire: ["91477"],
    });
    await TestUtil.create(DB.aide, {
      content_id: "2",
      codes_commune_from_partenaire: ["21231"],
    });

    // WHEN
    const response = await TestUtil.GET("/aides?code_commune=21231");

    // THEN
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].content_id).toEqual("2");
  });

  it(`GET /aides filtrage par code commune avec arrondissement `, async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    await TestUtil.create(DB.aide, {
      content_id: "1",
      codes_commune_from_partenaire: ["75056"],
      echelle: Echelle.Métropole,
    });

    // WHEN
    const response = await TestUtil.GET("/aides?code_commune=75108");

    // THEN
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  it(`GET /aides filtrage par departement`, async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    await TestUtil.create(DB.aide, {
      content_id: "1",
      codes_commune_from_partenaire: [],
      codes_departement_from_partenaire: ["21"],
      codes_region_from_partenaire: [],
    });

    // WHEN
    const response = await TestUtil.GET("/aides?code_commune=21231");

    // THEN
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  it(`GET /aides filtrage par departement - NO MATCH`, async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    await TestUtil.create(DB.aide, {
      content_id: "1",
      codes_commune_from_partenaire: [],
      codes_departement_from_partenaire: ["22"],
      codes_region_from_partenaire: [],
    });

    // WHEN
    const response = await TestUtil.GET("/aides?code_commune=21231");

    // THEN
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0);
  });

  it(`GET /aides filtrage par region`, async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    await TestUtil.create(DB.aide, {
      content_id: "1",
      codes_commune_from_partenaire: [],
      codes_departement_from_partenaire: [],
      codes_region_from_partenaire: ["27"],
    });

    // WHEN
    const response = await TestUtil.GET("/aides?code_commune=21231");

    // THEN
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  it(`GET /aides filtrage par besoin`, async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    await TestUtil.create(DB.aide, {
      content_id: "1",
      codes_commune_from_partenaire: ["21231"],
      codes_departement_from_partenaire: [],
      codes_region_from_partenaire: [],
      besoin: Besoin.broyer_vege,
    });
    await TestUtil.create(DB.aide, {
      content_id: "2",
      codes_commune_from_partenaire: ["21231"],
      codes_departement_from_partenaire: [],
      codes_region_from_partenaire: [],
      besoin: Besoin.composter,
    });

    // WHEN
    const response = await TestUtil.GET("/aides?code_commune=21231");

    // THEN
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);

    // WHEN
    const response2 = await TestUtil.GET(
      "/aides?besoin=composter&code_commune=21231"
    );

    // THEN
    expect(response2.status).toBe(200);
    expect(response2.body).toHaveLength(1);
  });
  it(`GET /aides besoin inconnu`, async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    // WHEN
    const response = await TestUtil.GET("/aides?besoin=voler");

    // THEN
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual("Besoin [voler] inconnu");
  });

  it(`GET /aides filtrage par region - NO MATCH`, async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    await TestUtil.create(DB.aide, {
      content_id: "1",
      codes_commune_from_partenaire: [],
      codes_departement_from_partenaire: [],
      codes_region_from_partenaire: ["28"],
    });

    // WHEN
    const response = await TestUtil.GET("/aides?code_commune=21231");

    // THEN
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0);
  });

  it(`GET /aides/id aide manquante`, async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    await TestUtil.create(DB.aide, {
      partenaires_supp_ids: ["123"],
      content_id: "1",
    });
    await aideRepository.loadCache();

    // WHEN
    const response = await TestUtil.GET("/aides/45");

    // THEN
    expect(response.status).toBe(404);
  });

  it(`GET /aides/id consultation d'une aide à partir de son ID`, async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    await TestUtil.create(DB.partenaire);
    await partenaireRepository.loadCache();
    await TestUtil.create(DB.blockText, {
      code: "block_123",
      id_cms: "1",
      titre: "haha",
      texte: "the texte",
    });

    await blockTextRepository.loadCache();

    await TestUtil.create(DB.aide, {
      partenaires_supp_ids: ["123"],
      content_id: "45",
      contenu: "ksqjfhqsjf {block_123} dfjksqmlmfjq",
    });
    await aideRepository.loadCache();

    // WHEN
    const response = await TestUtil.GET("/aides/45");

    // THEN
    expect(response.status).toBe(200);

    const aideBody = response.body as AideAPI;

    expect(aideBody).toEqual({
      content_id: "45",
      titre: "titreA",
      contenu: "ksqjfhqsjf the texte dfjksqmlmfjq",
      derniere_maj: null,
      url_simulateur: "/aides/velo",
      url_source: "https://hello",
      url_demande: "https://demande",
      thematiques: ["climat", "logement"],
      montant_max: 999,
      besoin_desc: "Acheter un vélo",
      besoin: "acheter_velo",
      partenaire_nom: "ADEME",
      partenaire_url: "https://ademe.fr",
      partenaire_logo_url: "logo_url",
      echelle: "National",
      est_gratuit: false,
      question_accroche: "A",
      introduction: "B",
      explication: "C",
      conditions_eligibilite: "D",
      equipements_eligibles: "E",
      travaux_eligibles: "F",
      montant: "G",
      en_savoir_plus: "H",
      description_courte: "I",
    });
  });

  it(`GET /aides remplace un block de texte dans une aide aussi dans la consultation du catalogue`, async () => {
    // FIXME : C'est challengeable d'un point de vu usage et perf, mieux vaut avoir un contenu plus light en cas de consultation du catalogue ?
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    await TestUtil.create(DB.blockText, {
      code: "block_123",
      id_cms: "1",
      titre: "haha",
      texte: "the texte",
    });

    await blockTextRepository.loadCache();

    await TestUtil.create(DB.aide, {
      partenaires_supp_ids: ["123"],
      contenu: "ksqjfhqsjf {block_123} dfjksqmlmfjq",
      codes_commune_from_partenaire: ["21231"],
    });

    // WHEN
    const response = await TestUtil.GET("/aides?code_commune=21231");

    // THEN
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);

    const aideBody = response.body[0] as AideAPI;
    expect(aideBody.contenu).toEqual("ksqjfhqsjf the texte dfjksqmlmfjq");
  });
  it("GET /utilisateurs/:utilisateurId/aides aide non visible si expirée", async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";
    await TestUtil.create(DB.aide, {
      date_expiration: new Date(123),
      codes_commune_from_partenaire: ["21231"],
    });

    // WHEN
    const response = await TestUtil.GET("/aides?code_commune=21231");

    // THEN
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0);
  });

  it("GET /aides filtre par thematique simple", async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";
    await TestUtil.create(DB.aide, {
      content_id: "1",
      codes_commune_from_partenaire: ["21231"],
      thematiques: [Thematique.alimentation],
    });
    await TestUtil.create(DB.aide, {
      content_id: "2",
      codes_commune_from_partenaire: ["21231"],
      thematiques: [Thematique.logement],
    });
    await TestUtil.create(DB.aide, {
      content_id: "3",
      codes_commune_from_partenaire: ["21231"],
      thematiques: [Thematique.logement, Thematique.consommation],
    });

    // WHEN
    const response = await TestUtil.GET(
      "/aides?thematique=logement&code_commune=21231"
    );

    // THEN
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it("GET /utilisateurs/:utilisateurId/aides filtre par thematique multiple", async () => {
    // GIVEN
    process.env.API_KEY = "12345";
    TestUtil.token = "12345";

    await TestUtil.create(DB.aide, {
      content_id: "1",
      codes_commune_from_partenaire: ["21231"],
      thematiques: [Thematique.alimentation],
    });
    await TestUtil.create(DB.aide, {
      content_id: "2",
      codes_commune_from_partenaire: ["21231"],
      thematiques: [Thematique.logement],
    });
    await TestUtil.create(DB.aide, {
      content_id: "3",
      codes_commune_from_partenaire: ["21231"],
      thematiques: [Thematique.logement, Thematique.consommation],
    });
    await TestUtil.create(DB.aide, {
      content_id: "4",
      codes_commune_from_partenaire: ["21231"],
      thematiques: [Thematique.consommation],
    });
    await TestUtil.create(DB.aide, {
      content_id: "5",
      codes_commune_from_partenaire: ["21231"],
      thematiques: [Thematique.climat],
    });
    await TestUtil.create(DB.aide, {
      content_id: "6",
      codes_commune_from_partenaire: ["21231"],
      thematiques: [Thematique.loisir],
    });

    // WHEN
    const response = await TestUtil.GET(
      "/aides?thematique=logement&thematique=climat&code_commune=21231"
    );

    // THEN
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
  });
});
