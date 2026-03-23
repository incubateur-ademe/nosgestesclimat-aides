import _communes from "@etalab/decoupage-administratif/data/communes.json";
import _departements from "@etalab/decoupage-administratif/data/departements.json";
import _epci from "@etalab/decoupage-administratif/data/epci.json";
import _regions from "@etalab/decoupage-administratif/data/regions.json";
import { Injectable } from "@nestjs/common";

const LISTE_COMMUNES = _communes as Commune[];
const LISTE_EPCIS = _epci as EPCI[];

const map_code_commune_to_commune: Map<string, Commune> = new Map();
const map_code_postal_to_codes_communes: Map<string, Set<string>> = new Map();
const map_code_EPCI_to_EPCI: Map<string, EPCI> = new Map();

for (const com of LISTE_COMMUNES) {
  // on ignore les communes sans codes postaux
  if (com.codesPostaux) {
    map_code_commune_to_commune.set(com.code, com);

    for (const code_postal of com.codesPostaux) {
      const current_entry = map_code_postal_to_codes_communes.get(code_postal);
      if (current_entry) {
        current_entry.add(com.code);
      } else {
        const set = new Set<string>();
        set.add(com.code);
        map_code_postal_to_codes_communes.set(code_postal, set);
      }
    }
  }
}
for (const une_epci of LISTE_EPCIS) {
  map_code_EPCI_to_EPCI.set(une_epci.code, une_epci);
}

/** Associate each commune INSEE code to its EPCI SIREN code. */
const map_code_commune_to_code_EPCI = Object.fromEntries(
  _epci.flatMap((epci) => epci.membres.map(({ code }) => [code, epci.code]))
);

export enum TypeCommune {
  Urbain = "Urbain",
  Rural = "Rural",
  "Péri-urbain" = "Péri-urbain",
}
export type TypologieCommune = {
  Ville: string;
  Classification: TypeCommune;
  CATEAAV2020: number;
  TAAV2017: number;
  DROM: number;
};

export type CommuneParCodePostal = {
  // NOTE: Le code INSEE peut correspondre dans certains cas au code INSEE de
  // l'arrondissement et non de la commune (ex. Lyon 06).
  INSEE: string;
  commune: string;
  acheminement: string;
  Ligne_5: string;
};

export type Region = {
  code: string;
  nom: string;
};

export type Departement = {
  code: string;
  nom: string;
};

/**
 * NOTE: this type has been inferred from the
 * @etalab/decoupage-administratif/data/communes.json file  by running 'fx
 * @.<key> uniq sort' on the data. Therefore, there is no guarantee that in
 * future versions of the data, the keys will remain the same.
 */
export type Commune = {
  /** The INSEE code of the commune (e.g. "75056"). */
  code: string;
  commune: string;
  nom: string;
  typeLiaison?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8;
  zone: "metro" | "drom" | "com";
  arrondissement?: string;
  departement: string;
  region: string;
  type:
    | "commune-actuelle"
    | "commune-deleguee"
    | "commune-associee"
    | "arrondissement-municipal";
  rangChefLieu?: 0;
  siren?: string;
  codesPostaux?: string[];
  population?: number;
};

/**
 * NOTE: this type has been inferred from the
 * @etalab/decoupage-administratif/data/epci.json file  by running 'fx @.<key>
 * uniq sort' on the data. Therefore, there is no guarantee that in future
 * versions of the data, the keys will remain the same.
 */
export type EPCI = {
  /** The SIREN code of the EPCI (e.g. "200000172"). */
  code: string;
  /** The name of the EPCI (e.g. "CC Faucigny - Glières"). */
  nom: string;
  /** The type of the EPCI (i.e. "Communauté d'agglomération", "Communauté de communes", ...). */
  type: "CA" | "CC" | "CU" | "MET69" | "METRO";
  modeFinancement: "FA" | "FPU";
  populationTotale: number;
  populationMunicipale: number;
  membres: Array<
    Pick<Commune, "code" | "siren" | "nom"> & {
      populationTotale: number;
      populationMunicipale: number;
    }
  >;
};

@Injectable()
export class CommuneRepository {
  constructor() {}

  supprimernDoublonsCommunesEtLigne5(referentiel) {
    for (const code_postal in referentiel) {
      let commune_map = new Map<string, CommuneParCodePostal>();
      referentiel[code_postal].forEach(
        (current_commune: CommuneParCodePostal) => {
          delete current_commune.Ligne_5;
          commune_map.set(current_commune.commune, current_commune);
        }
      );
      referentiel[code_postal] = [...commune_map.values()];
    }
  }

  /**
   * Get the EPCI by its SIREN code.
   *
   * @param code The SIREN code of the EPCI (e.g. "200000172").
   * @returns The EPCI if found, `undefined` otherwise.
   *
   * PERF: could we use a more clever data structure to have a O(1) lookup?
   */
  public getEPCIBySIRENCode(code_siren: string): EPCI | undefined {
    return map_code_EPCI_to_EPCI.get(code_siren);
  }

  public getNomDepartementByCode(code: string): string {
    const result = (_departements as Departement[]).find(
      (d) => d.code === code
    );
    return result ? result.nom : "INCONNU";
  }

  // NOTE: why some methods are public and some are protected?
  public getNomRegionByCode(code: string): string {
    const result = (_regions as Region[]).find((d) => d.code === code);
    return result ? result.nom : "INCONNU";
  }

  // PERF: could we use a more clever data structure to have a O(1) lookup?
  isCodeSirenEPCI(code_siren: string): boolean {
    return map_code_EPCI_to_EPCI.get(code_siren) != undefined;
  }

  static getLibelleCommuneLowerCase(code_insee: string) {
    const commune = map_code_commune_to_commune.get(code_insee);
    if (commune) {
      return commune.nom;
    }
    return null;
  }

  public listeCodesCommunesByEPCICode(code_epci: string): string[] {
    const the_epci = this.getEPCIBySIRENCode(code_epci);
    const result = [];

    for (const membre of the_epci.membres) {
      result.push(membre.code);
    }

    return result;
  }

  public listeCodesCommunesByCodePostal(code_postal: string): string[] {
    const codes_communes = map_code_postal_to_codes_communes.get(code_postal);
    if (codes_communes) {
      return Array.from(codes_communes);
    }
    return [];
  }

  public estCommuneMembreDeEPCI(
    code_commune: string,
    code_epci: string
  ): boolean {
    const epci = this.getEPCIBySIRENCode(code_epci);
    if (epci) {
      return epci.membres.findIndex((c) => c.code === code_commune) >= 0;
    }
    return false;
  }

  public static findDepartementRegionByCodeCommune(code_commune: string): {
    code_departement: string;
    code_region: string;
  } {
    if (!code_commune) return undefined;

    let commune = map_code_commune_to_commune.get(code_commune);

    if (commune) {
      return {
        code_departement: commune.departement,
        code_region: commune.region,
      };
    } else {
      return undefined;
    }
  }

  getListeCodesCommuneParCodeEPCI(code_siren: string): string[] {
    const epci = map_code_EPCI_to_EPCI.get(code_siren);
    if (epci) {
      return epci.membres.map((m) => m.code);
    }
    return [];
  }

  public getCodePostauxFromCodeCommune(code_commune: string) {
    const commune = map_code_commune_to_commune.get(code_commune);
    if (commune) {
      return commune.codesPostaux;
    }
    return [];
  }

  public estDromCom(code_commune: string): boolean {
    if (!code_commune) return false;
    const commune = this.getCommuneByCodeINSEESansArrondissement(code_commune);
    if (!commune) return false;
    return commune.zone === "com" || commune.zone === "drom";
  }

  /**
   * Get the commune OR A DISTRICT by its INSEE code.
   *
   * @param inseeCode The INSEE code of the commune (e.g. "75056").
   * @returns The commune if found, `undefined` otherwise.
   *
   * @note The INSEE code is not the same as the postal code. It's a unique
   * identifier for each commune in France in contrast to the postal code which
   * can be shared by multiple communes.
   */
  public getCommuneByCodeINSEE(code_insee: string): Commune | undefined {
    return map_code_commune_to_commune.get(code_insee);
  }

  /**
   * Returns the commune by its INSEE code. If the INSEE code refers to an
   * arrondissement municipal, it will return the corresponding
   * commune.
   *
   * @param code_insee The INSEE code of the commune (e.g. "75056").
   * @returns The commune if found, `undefined` otherwise.
   *
   * @example
   * const commune = getCommuneByCodeINSEE('69386'); // 'Lyon 6e arrondissement'
   * commune.code; // '69123' (lyon)
   */
  public getCommuneByCodeINSEESansArrondissement(
    code_insee: string
  ): Commune | undefined {
    const commune = map_code_commune_to_commune.get(code_insee);
    if (commune === undefined) {
      return undefined;
    }

    return commune.type === "arrondissement-municipal"
      ? map_code_commune_to_commune.get(commune.commune)
      : commune;
  }

  /**
   * Returns the EPCI of the commune identified by its INSEE code.
   *
   * @param code_insee The INSEE code of the commune (e.g. "75056").
   * @returns The EPCI if found, `undefined` otherwise.
   *
   * @note This method expects that the INSEE code corresponds to a commune and
   * not an arrondissement. Use {@link getCommuneByCodeINSEESansArrondissement}
   * if you want to get the commune without arrondissement.
   */
  getEPCIByCommuneCodeINSEE(code_insee: string): EPCI | undefined {
    const epciCode = map_code_commune_to_code_EPCI[code_insee];
    return this.getEPCIBySIRENCode(epciCode);
  }
}
