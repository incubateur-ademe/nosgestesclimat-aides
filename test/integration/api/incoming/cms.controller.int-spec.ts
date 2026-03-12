import { CMSWebhookEntryAPI } from "src/infrastructure/api/types/cms/CMSWebhookEntryAPI";
import { Echelle } from "../../../../src/domain/aides/echelle";
import { Thematique } from "../../../../src/domain/thematique/thematique";
import { CMSEvent } from "../../../../src/infrastructure/api/types/cms/CMSEvent";
import { CMSModel } from "../../../../src/infrastructure/api/types/cms/CMSModels";
import { CMSWebhookAPI } from "../../../../src/infrastructure/api/types/cms/CMSWebhookAPI";
import { PartenaireRepository } from "../../../../src/infrastructure/repository/partenaire.repository";
import { DB, TestUtil } from "../../../TestUtil";

const CMS_DATA_AIDE: CMSWebhookAPI = {
  model: CMSModel.aide,
  event: CMSEvent["entry.publish"],
  entry: {
    id: 123,
    titre: "titre",
    description: "Contenu de l'aide",
    url_detail_front: "/aide/velo",
    url_source: "haha",
    url_demande: "hihi",
    is_simulation: true,
    montantMaximum: "123",
    thematiques: [
      { id: 1, titre: "Alimentation", code: Thematique.alimentation },
      { id: 2, titre: "Climat", code: Thematique.climat },
    ],
    partenaires: [
      {
        id: 1,
      },
    ],
    date_expiration: new Date(123),
    derniere_maj: new Date(123),
    codes_postaux: "91120 , 75002",
    publishedAt: new Date("2023-09-20T14:42:12.941Z"),
    besoin: {
      id: 7,
      code: "broyer_vege",
      description: "Broyer ses végétaux",
    },
    include_codes_commune: "01,02",
    exclude_codes_commune: "03,04",
    codes_departement: "78",
    codes_region: "25",
    est_gratuit: true,
    question_accroche: "question_accroche",
    introduction: "introduction",
    explication: "explication",
    conditions_eligibilite: "conditions_eligibilite",
    equipements_eligibles: "equipements_eligibles",
    travaux_eligibles: "travaux_eligibles",
    montant: "montant",
    en_savoir_plus: "en_savoir_plus",
    description_courte: "description_courte",
  } as CMSWebhookEntryAPI,
};

const CMS_DATA_PARTENAIRE: CMSWebhookAPI = {
  model: CMSModel.partenaire,
  event: CMSEvent["entry.publish"],
  entry: {
    id: 123,
    nom: "part",
    lien: "the lien",
    code_commune: "456",
    code_departement: "789",
    code_region: "111",
    code_epci: "242100410",
    echelle: Echelle.Département,
    logo: [
      {
        formats: {
          thumbnail: { url: "https://haha" },
        },
        url: "",
      },
    ],
  } as CMSWebhookEntryAPI,
};

const CMS_DATA_BLOCKTEXT: CMSWebhookAPI = {
  model: CMSModel.text,
  event: CMSEvent["entry.publish"],
  entry: {
    id: 123,
    code: "456",
    titre: "The titre",
    texte: "The texte",
  } as CMSWebhookEntryAPI,
};

const partenaireRepository = new PartenaireRepository(TestUtil.prisma);

beforeAll(async () => {
  await TestUtil.appinit();
});

beforeEach(async () => {
  await TestUtil.deleteAll();
  TestUtil.token = process.env.CMS_WEBHOOK_API_KEY;
});

afterAll(async () => {
  await TestUtil.appclose();
});

it("POST /api/incoming/cms - 401 si header manquant", async () => {
  // GIVEN
  // WHEN
  const response = await TestUtil.getServer()
    .post("/api/incoming/cms")
    .send(CMS_DATA_AIDE);

  // THEN
  expect(response.status).toBe(401);
});
it("POST /api/incoming/cms - 403 si mauvaise clé API", async () => {
  // GIVEN
  TestUtil.token = "bad";
  // WHEN
  const response = await TestUtil.POST("/api/incoming/cms").send(CMS_DATA_AIDE);

  // THEN
  expect(response.status).toBe(403);
});

it("POST /api/incoming/cms - create a new partenaire in partenaire table", async () => {
  // GIVEN

  await TestUtil.create(DB.aide, {
    partenaires_supp_ids: ["123"],
  });

  // WHEN
  const response =
    await TestUtil.POST("/api/incoming/cms").send(CMS_DATA_PARTENAIRE);

  // THEN
  const partenaire = await TestUtil.prisma.client.partenaire.findMany({});

  expect(response.status).toBe(201);
  expect(partenaire).toHaveLength(1);
  delete partenaire[0].created_at;
  delete partenaire[0].updated_at;
  expect(partenaire[0]).toEqual({
    code_commune: "456",
    code_departement: "789",
    code_epci: "242100410",
    code_region: "111",
    content_id: "123",
    echelle: "Département",
    image_url: "https://haha",
    liste_communes_calculees: [
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
    ],
    nom: "part",
    url: "the lien",
  });

  const aideDB = (await TestUtil.prisma.client.aide.findMany())[0];

  expect(aideDB.codes_commune_from_partenaire).toEqual([
    "456",
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
  ]);
  expect(aideDB.codes_departement_from_partenaire).toEqual(["789"]);
  expect(aideDB.codes_region_from_partenaire).toEqual(["111"]);
});

it("POST /api/incoming/cms - create a new BlockTexte", async () => {
  // GIVEN

  // WHEN
  const response =
    await TestUtil.POST("/api/incoming/cms").send(CMS_DATA_BLOCKTEXT);

  // THEN
  const faq = await TestUtil.prisma.client.blockText.findMany({});

  expect(response.status).toBe(201);
  expect(faq).toHaveLength(1);
  expect(faq[0].id_cms).toEqual("123");
  expect(faq[0].code).toEqual("456");
  expect(faq[0].titre).toEqual("The titre");
  expect(faq[0].texte).toEqual("The texte");
});

it("POST /api/incoming/cms - create a new aide in aide table", async () => {
  // GIVEN
  await TestUtil.create(DB.partenaire, {
    content_id: "1",
    code_epci: "242100410",
    code_commune: "91477",
    code_departement: "123",
    code_region: "456",
  });
  await partenaireRepository.loadCache();

  // WHEN
  const response = await TestUtil.POST("/api/incoming/cms").send(CMS_DATA_AIDE);

  // THEN
  const aides = await TestUtil.prisma.client.aide.findMany({});

  expect(response.status).toBe(201);
  expect(aides).toHaveLength(1);
  const aide = aides[0];
  delete aide.created_at;
  delete aide.updated_at;

  expect(aide).toEqual({
    besoin: "broyer_vege",
    besoin_desc: "Broyer ses végétaux",
    codes_commune_from_partenaire: TestUtil.CODE_COMMUNE_FROM_PARTENAIRE,
    codes_departement: ["78"],
    codes_departement_from_partenaire: ["123"],
    codes_postaux: ["91120", "75002"],
    codes_region: ["25"],
    codes_region_from_partenaire: ["456"],
    content_id: "123",
    contenu: "Contenu de l'aide",
    date_expiration: new Date(123),
    derniere_maj: new Date(123),
    echelle: null,
    est_gratuit: true,
    exclude_codes_commune: ["03", "04"],
    include_codes_commune: ["01", "02"],
    is_simulateur: true,
    montant_max: 123,
    partenaires_supp_ids: ["1"],
    thematiques: ["alimentation", "climat"],
    titre: "titre",
    url_demande: "hihi",
    url_simulateur: "/aide/velo",
    url_source: "haha",
    VISIBLE_PROD: true,
    question_accroche: "question_accroche",
    introduction: "introduction",
    explication: "explication",
    conditions_eligibilite: "conditions_eligibilite",
    equipements_eligibles: "equipements_eligibles",
    travaux_eligibles: "travaux_eligibles",
    montant: "montant",
    en_savoir_plus: "en_savoir_plus",
    description_courte: "description_courte",
  });
});

it("POST /api/incoming/cms - updates exisying aide in aide table", async () => {
  // GIVEN
  await TestUtil.create(DB.aide, { content_id: "123" });
  await TestUtil.create(DB.partenaire, {
    content_id: "1",
    code_epci: "242100410",
    code_commune: "91477",
    code_departement: "123",
    code_region: "456",
  });
  await partenaireRepository.loadCache();

  // WHEN
  const response = await TestUtil.POST("/api/incoming/cms").send(CMS_DATA_AIDE);

  // THEN
  const aides = await TestUtil.prisma.client.aide.findMany({});

  expect(response.status).toBe(201);
  expect(aides).toHaveLength(1);
  const aide = aides[0];
  delete aide.updated_at;
  delete aide.created_at;

  expect(aide).toEqual({
    besoin: "broyer_vege",
    besoin_desc: "Broyer ses végétaux",
    codes_commune_from_partenaire: TestUtil.CODE_COMMUNE_FROM_PARTENAIRE,
    codes_departement: ["78"],
    codes_departement_from_partenaire: ["123"],
    codes_postaux: ["91120", "75002"],
    codes_region: ["25"],
    codes_region_from_partenaire: ["456"],
    content_id: "123",
    contenu: "Contenu de l'aide",
    date_expiration: new Date(123),
    derniere_maj: new Date(123),
    echelle: "National",
    est_gratuit: true,
    exclude_codes_commune: ["03", "04"],
    include_codes_commune: ["01", "02"],
    is_simulateur: true,
    montant_max: 123,
    partenaires_supp_ids: ["1"],
    thematiques: ["alimentation", "climat"],
    titre: "titre",
    url_demande: "hihi",
    url_simulateur: "/aide/velo",
    url_source: "haha",
    VISIBLE_PROD: true,
    question_accroche: "question_accroche",
    introduction: "introduction",
    explication: "explication",
    conditions_eligibilite: "conditions_eligibilite",
    equipements_eligibles: "equipements_eligibles",
    travaux_eligibles: "travaux_eligibles",
    montant: "montant",
    en_savoir_plus: "en_savoir_plus",
    description_courte: "description_courte",
  });
});

it("POST /api/incoming/cms - removes existing aide when unpublish", async () => {
  // GIVEN
  await TestUtil.create(DB.aide, { content_id: "123" });

  // WHEN
  const response = await TestUtil.POST("/api/incoming/cms").send({
    ...CMS_DATA_AIDE,
    event: CMSEvent["entry.unpublish"],
  });

  // THEN
  const aides = await TestUtil.prisma.client.aide.findMany({});

  expect(response.status).toBe(201);
  expect(aides).toHaveLength(0);
});
it("POST /api/incoming/cms - removes existing aide when delete", async () => {
  // GIVEN
  await TestUtil.create(DB.aide, { content_id: "123" });

  // WHEN
  const response = await TestUtil.POST("/api/incoming/cms").send({
    ...CMS_DATA_AIDE,
    event: CMSEvent["entry.delete"],
  });

  // THEN
  const aides = await TestUtil.prisma.client.aide.findMany({});

  expect(response.status).toBe(201);
  expect(aides).toHaveLength(0);
});

it("POST /api/incoming/cms - does nothing when no publishedAt value", async () => {
  // GIVEN
  const data = { ...CMS_DATA_AIDE };
  data.entry = { ...data.entry };
  data.entry.publishedAt = null;
  // WHEN
  const response = await TestUtil.POST("/api/incoming/cms").send(data);

  // THEN
  const aideDB = await TestUtil.prisma.client.aide.findMany({});
  expect(response.status).toBe(201);
  expect(aideDB).toHaveLength(0);
});
