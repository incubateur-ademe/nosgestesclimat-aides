import { Injectable } from "@nestjs/common";
import { BlockTextRepository } from "./repository/blockText.repository";

export enum CLE_PERSO {
  espace_insecable = "espace_insecable",
  block_text_cms = "block_text_cms",
  no_blank_links = "not_blank_links",
}

@Injectable()
export class Personnalisator {
  public personnaliser<T>(obj: T, disable_actions: CLE_PERSO[] = []): T {
    if (obj === undefined) return undefined;
    if (obj === null) return null;

    if (obj instanceof Array) {
      for (let index = 0; index < (obj as Array<any>).length; index++) {
        obj[index] = this.personnaliser(obj[index], disable_actions);
      }
      return obj;
    } else if (obj instanceof Date) {
      return obj;
    } else {
      if (typeof obj === "string") {
        return this.personnaliserText(obj, disable_actions) as any;
      } else if (typeof obj === "object") {
        for (const [key, value] of Object.entries(obj)) {
          obj[key] = this.personnaliser(value, disable_actions);
        }
        return obj;
      } else {
        return obj;
      }
    }
  }

  private personnaliserText(
    text: string,
    disable_actions: CLE_PERSO[] = []
  ): string {
    let new_value = text;
    if (this.isActive(CLE_PERSO.espace_insecable, disable_actions)) {
      new_value = this.replaceLastSpaceByNBSP(text);
    }

    if (this.isActive(CLE_PERSO.block_text_cms, disable_actions)) {
      new_value = this.replaceCmsBlockText(new_value);
    }

    if (this.isActive(CLE_PERSO.no_blank_links, disable_actions)) {
      new_value = new_value.replace(/_self|_parent|_top/gi, "_blank");
      new_value = new_value.replace(/<a /gi, '<a target="_blank" ');
    }

    return new_value;
  }

  private replaceCmsBlockText(source: string): string {
    let result = source;
    for (const code of BlockTextRepository.getCodeIterator()) {
      result = result.replace(
        `{${code}}`,
        BlockTextRepository.getTexteByCode(code)
      );
    }
    return result;
  }

  private replaceLastSpaceByNBSP(source: string): string {
    const length = source.length;
    if (length > 3 && source.substring(length - 2, length - 1) === " ") {
      return (
        source.substring(0, length - 2) +
        " " +
        source.substring(length - 1, length)
      ); // espace inseccable
    } else {
      return source;
    }
  }

  private isActive(cle: CLE_PERSO, disable_actions: CLE_PERSO[]): boolean {
    return !disable_actions.includes(cle);
  }
}
