export class App {
  static USER_CURRENT_VERSION = 27;
  static BACK_CURRENT_VERSION = "1";

  public static isProd(): boolean {
    return process.env.IS_PROD === "true";
  }
  public static listEmailsWarningAideExpiration(): string[] {
    if (process.env.EMAILS_WARNING_AIDE_EXPIRATION) {
      return process.env.EMAILS_WARNING_AIDE_EXPIRATION.split(",");
    } else {
      return [];
    }
  }
  public static isMailEnabled(): boolean {
    return process.env.EMAIL_ENABLED === "true";
  }
  public static getCmsApiKey(): string {
    return process.env.CMS_API_KEY;
  }

  public static getCmsURL(): string {
    return process.env.CMS_URL;
  }
  public static getBrevoApiToken(): string {
    return process.env.EMAIL_API_TOKEN;
  }
  public static getCMSWebhookAPIKey(): string {
    return process.env.CMS_WEBHOOK_API_KEY;
  }
  public static getAPIKey(): string {
    return process.env.API_KEY;
  }
  public static getAdminAPIKey(): string {
    return process.env.ADMIN_API_KEY;
  }
}
