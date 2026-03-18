import {
  CLE_PERSO,
  Personnalisator,
} from "../../src/infrastructure/personnalisator";
import { BlockTextRepository } from "../../src/infrastructure/repository/blockText.repository";
import { DB, TestUtil } from "../TestUtil";

describe("Personalisation", () => {
  const personnalisation = new Personnalisator();
  let blockTextRepository = new BlockTextRepository(TestUtil.prisma);

  beforeAll(async () => {
    await TestUtil.appinit();
  });

  beforeEach(async () => {
    await TestUtil.deleteAll();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await TestUtil.appclose();
  });

  it("perso : ne touche pas une chaine quelconque", async () => {
    // GIVEN
    const test_data = { yo: "123" };

    // WHEN
    const result = personnalisation.personnaliser(test_data);

    // THEN
    expect(result).toStrictEqual({ yo: "123" });
  });
  it("perso : ne bug pas sur undefined , null, et autres types", async () => {
    // GIVEN

    const test_data = { yo: undefined, yi: null, ya: true };

    // WHEN
    const result = personnalisation.personnaliser(test_data);

    // THEN
    expect(result).toStrictEqual({ yo: undefined, yi: null, ya: true });
  });
  it("perso : remplace espace insécable OK", async () => {
    // GIVEN
    const test_data = { a: "Comment ça va ?" };

    // WHEN
    const result = personnalisation.personnaliser(test_data);

    // THEN
    expect(result).toStrictEqual({
      a: "Comment ça va ?",
    });
  });
  it("perso : ne remplace pas espace insécable OK si on dit que non", async () => {
    // GIVEN
    const test_data = { a: "Comment ça va ?" };

    // WHEN
    const result = personnalisation.personnaliser(test_data, [
      CLE_PERSO.espace_insecable,
    ]);

    // THEN
    expect(result).toStrictEqual({
      a: "Comment ça va ?",
    });
  });

  it("perso : préserve les dates", async () => {
    // GIVEN
    const test_data = { done_at: new Date(1) };

    // WHEN
    const result = personnalisation.personnaliser(test_data);

    // THEN
    expect(result).toStrictEqual({ done_at: new Date(1) });
  });
  it("remplace les block des texte", async () => {
    // GIVEN
    await TestUtil.create(DB.blockText, {
      code: "aaa",
      id_cms: "1",
      titre: "haha",
      texte: "George",
    });

    await blockTextRepository.loadCache();

    const test_data = { somedata: "hello {aaa}, how are you?" };

    // WHEN
    const result = personnalisation.personnaliser(test_data);

    // THEN
    expect(result).toStrictEqual({ somedata: "hello George, how are you?" });
  });
});
