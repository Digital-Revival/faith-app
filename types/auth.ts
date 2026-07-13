export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName?: string;
  bibleschoolSimpleModeEnabled?: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}
