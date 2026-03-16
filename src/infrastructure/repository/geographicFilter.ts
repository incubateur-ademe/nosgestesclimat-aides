import { Echelle } from "../../domain/aides/echelle";
import { CommuneRepository } from "./commune/commune.repository";

export class GeographicSQLFilter {
  public static generateClauses(
    code_commune: string,
    echelle?: Echelle
  ): any[] {
    const clauses = [];

    const dep =
      CommuneRepository.findDepartementRegionByCodeCommune(code_commune);
    const code_departement = dep?.code_departement;
    const code_region = dep?.code_region;

    if (echelle) {
      clauses.push({
        echelle: echelle,
      });
    }

    if (code_commune) {
      clauses.push({
        OR: [
          { exclude_codes_commune: { isEmpty: true } },
          { NOT: { exclude_codes_commune: { has: code_commune } } },
        ],
      });
      clauses.push({
        OR: [
          {
            codes_commune_from_partenaire: {
              has: code_commune,
            },
          },
          { codes_commune_from_partenaire: { isEmpty: true } },
        ],
      });
    }

    if (code_departement) {
      clauses.push({
        OR: [
          {
            codes_departement_from_partenaire: {
              has: code_departement,
            },
          },
          { codes_departement_from_partenaire: { isEmpty: true } },
        ],
      });
    }

    if (code_region) {
      clauses.push({
        OR: [
          {
            codes_region_from_partenaire: {
              has: code_region,
            },
          },
          { codes_region_from_partenaire: { isEmpty: true } },
        ],
      });
    }

    return clauses;
  }
}
