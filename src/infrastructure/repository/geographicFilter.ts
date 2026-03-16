import { Echelle } from "../../domain/aides/echelle";
import { CommuneRepository } from "./commune/commune.repository";

export class GeographicSQLFilter {
  public static generateClauses(
    code_commune: string[],
    echelle?: Echelle
  ): any[] {
    const clauses = [];

    let code_departement;
    let code_region;

    if (code_commune && code_commune.length > 0) {
      const dep = CommuneRepository.findDepartementRegionByCodeCommune(
        code_commune[0]
      );
      code_departement = dep?.code_departement;
      code_region = dep?.code_region;
    }

    if (echelle) {
      clauses.push({
        echelle: echelle,
      });
    }

    if (code_commune) {
      clauses.push({
        OR: [
          { exclude_codes_commune: { isEmpty: true } },
          { NOT: { exclude_codes_commune: { hasSome: code_commune } } },
        ],
      });
      clauses.push({
        OR: [
          {
            codes_commune_from_partenaire: {
              hasSome: code_commune,
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
