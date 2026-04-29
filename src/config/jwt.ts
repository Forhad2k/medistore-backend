export const JWT_SECRET: string =
  process.env.JWT_SECRET ?? "fallback-secret-CHANGE-IN-PRODUCTION";

export const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN ?? "7d";
