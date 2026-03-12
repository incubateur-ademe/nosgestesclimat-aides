import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  UseFilters,
} from "@nestjs/common";
import { Request } from "express";
import { App } from "../../../src/domain/app";
import { Thematique } from "../../domain/thematique/thematique";
import { ApplicationError } from "../applicationError";
import { ControllerExceptionFilter } from "./controllerException.filter";

@UseFilters(new ControllerExceptionFilter())
@Injectable()
export class GenericControler {
  public getURLFromRequest(req: Request): string {
    return `${req.protocol}://${req.get("Host")}${req.originalUrl}`;
  }

  public getAllCastedThematiqueOrExceptionFromAPIInput(
    input: string | string[]
  ): Thematique[] {
    return this.getStringListFromStringArrayAPIInput(input).map((s) =>
      this.castThematiqueOrException(s)
    );
  }

  public getAllCastedSelectionOrExceptionFromAPIInput(
    input: string | string[]
  ): Selection[] {
    return this.getStringListFromStringArrayAPIInput(input).map((s) =>
      this.castSelectionOrException(s)
    );
  }

  public getStringListFromStringArrayAPIInput(input): string[] {
    if (input) {
      const isString = typeof input === "string" || input instanceof String;
      if (isString) {
        return [input as string];
      } else {
        return input;
      }
    }
    return [];
  }

  public castThematiqueOrException(code_thematique: string): Thematique {
    const thematique = Thematique[code_thematique];
    if (!thematique) {
      ApplicationError.throwThematiqueNotFound(code_thematique);
    }
    return thematique;
  }

  public castSelectionOrException(code_selection: string): Selection {
    const selection = Selection[code_selection];
    if (!selection) {
      ApplicationError.throwSelectionNotFound(code_selection);
    }
    return selection;
  }

  checkAPIProtectedEndpoint(request: Request) {
    const authorization = request.headers["authorization"] as string;
    if (!authorization) {
      throw new UnauthorizedException("API KEY manquante");
    }
    if (!authorization.endsWith(App.getAPIKey())) {
      throw new ForbiddenException("API KEY incorrecte");
    }
  }
}
