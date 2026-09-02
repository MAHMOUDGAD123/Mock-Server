declare namespace Globals {
  type EnvironmentMode = "development" | "production";

  interface ReplaySchema<T = unknown> {
    status: string;
    message: string;
    data?: T;
  }
}
