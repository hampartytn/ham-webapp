export type NestErrorDetail = {
  field: string;
  issue: string;
};

export type NestErrorBody = {
  error: {
    code: string;
    message: string;
    details?: NestErrorDetail[];
    requestId?: string;
  };
};

export type NestData<T> = {
  data: T;
};

export type Role = "EMPLOYEE" | "EMPLOYER" | "ADMIN" | "SUPER_ADMIN";
export type AccountStatus =
  | "PENDING_PHONE"
  | "ACTIVE"
  | "SUSPENDED"
  | "BLOCKED";
export type PreferredLanguage = "ta" | "en" | "hi";
export type OtpPurpose = "REGISTER" | "LOGIN" | "PASSWORD_RESET";

export type AuthUserView = {
  id: string;
  role: Role;
  phone: string;
  preferredLanguage: PreferredLanguage;
  accountStatus: AccountStatus;
};

export type AuthTokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  user: AuthUserView;
};

export type RegisterResult = {
  userId: string;
  phone: string;
  accountStatus: "PENDING_PHONE";
};

export class NestApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: NestErrorDetail[];
  readonly requestId?: string;

  constructor(args: {
    status: number;
    code: string;
    message: string;
    details?: NestErrorDetail[];
    requestId?: string;
  }) {
    super(args.message);
    this.name = "NestApiError";
    this.status = args.status;
    this.code = args.code;
    this.details = args.details;
    this.requestId = args.requestId;
  }
}
