import { CommuneRepository } from "../../../src/infrastructure/repository/commune/commune.repository";
import { TestUtil } from "../../TestUtil";

describe("CommuneRepository", () => {
  let communeRepository = new CommuneRepository(TestUtil.prisma);

  beforeAll(async () => {
    await TestUtil.appinit();
  });

  beforeEach(async () => {
    await TestUtil.deleteAll();
  });

  afterAll(async () => {
    await TestUtil.appclose();
  });

  it("getListCommunesParCodePostal : supprime les doublons", async () => {
    // GIVEN
    const toClean = {
      "10330": [
        {
          INSEE: "10333",
          commune: "The_commune",
          acheminement: "ST ANDRE LES VERGERS",
          Ligne_5: "lieu dit 1",
        },
        {
          INSEE: "10334",
          commune: "The_commune",
          acheminement: "ST ANDRE LES VERGERS",
          Ligne_5: "lieu dit 2",
        },
      ],
    };
    // WHEN
    communeRepository.supprimernDoublonsCommunesEtLigne5(toClean);

    // THEN
    expect(toClean["10330"]).toHaveLength(1);
    expect(toClean["10330"][0].commune).toEqual("The_commune");
    expect(toClean["10330"][0].Ligne_5).toBeUndefined();
  });
  it(`getListeCodesCommuneParCodeEPCI : listes communes d'une EPCI`, async () => {
    // WHEN
    const result =
      communeRepository.getListeCodesCommuneParCodeEPCI("242100410");

    // THEN
    expect(result).toHaveLength(23);
    expect(result).toContain("21605");
  });

  it(`listeCodesCommunesByCodePostal : commune unique par code postal`, async () => {
    // WHEN
    const result = communeRepository.listeCodesCommunesByCodePostal("21000");

    // THEN
    expect(result).toEqual(["21231"]);
  });

  it(`listeCodesCommunesByCodePostal : communes multiples par code postal`, async () => {
    // WHEN
    const result = communeRepository.listeCodesCommunesByCodePostal("54490");

    // THEN
    expect(result).toHaveLength(7);
  });

  describe("getCommuneByCodeINSEE", () => {
    test("doit retourner la commune pour un code INSEE valide", async () => {
      // WHEN
      const result =
        communeRepository.getCommuneByCodeINSEESansArrondissement("21231");

      // THEN
      expect(result).toBeDefined();
      expect(result.code).toEqual("21231");
      expect(result.nom).toEqual("Dijon");
    });

    test("doit retourner undefined pour un code INSEE invalide", async () => {
      // WHEN
      const result =
        communeRepository.getCommuneByCodeINSEESansArrondissement("99999");

      // THEN
      expect(result).toBeUndefined();
    });

    test("doit retourner undefined pour un code INSEE undefined", async () => {
      // WHEN
      const result =
        communeRepository.getCommuneByCodeINSEESansArrondissement(undefined);

      // THEN
      expect(result).toBeUndefined();
    });

    test("doit retourner la commune pour un code INSEE correspondant à un arrondissement", async () => {
      // WHEN
      const result =
        communeRepository.getCommuneByCodeINSEESansArrondissement("75101");

      // THEN
      expect(result).toHaveProperty("code", "75056");
      expect(result).toHaveProperty("nom", "Paris");
    });
  });
});
