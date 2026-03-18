import { ApiProperty } from "@nestjs/swagger";

export class ApplicationError {
  @ApiProperty()
  code: string;
  @ApiProperty()
  message: string;
  http_status: number;
  @ApiProperty()
  message_tech: string;

  private constructor(
    code: string,
    message: string,
    http_status?: number,
    message_tech?: string
  ) {
    this.code = code;
    this.message = message;
    this.http_status = http_status ? http_status : 400;
    this.message_tech = message_tech;
  }
  private static throwAppError(
    code: string,
    message: string,
    http_status?: number,
    message_tech?: string
  ) {
    throw new ApplicationError(code, message, http_status, message_tech);
  }

  static throwAideNotFound(content_id: string) {
    this.throwAppError("01", `l'aide d'id [${content_id}] n'existe pas`, 404);
  }
  static throwThematiqueNotFound(them: string) {
    this.throwAppError("02", `Thematique [${them}] inconnue`);
  }
  static throwBesoinNotFound(bes: string) {
    this.throwAppError("03", `Besoin [${bes}] inconnu`);
  }
  static throwSelectionNotFound(sel: string) {
    this.throwAppError("04", `Selection [${sel}] inconnue`);
  }
  static throwCodePostalOuCodeCommune() {
    this.throwAppError(
      "05",
      `Impossible de renseigner en même temps un code postal ET un code commune`
    );
  }
  static throwCodeCommuneNotFound(code: string) {
    this.throwAppError(
      "06",
      `le code INSEE de commune [${code}] n'existe pas`,
      400
    );
  }
  static throwCodePostalNotFound(code: string) {
    this.throwAppError("07", `le code postal [${code}] n'existe pas`, 400);
  }
  static throwCodePostalOuCodeCommuneObligatoire() {
    this.throwAppError(
      "08",
      `Un code postal ou un code commune doit être saisi`
    );
  }
}
