import { FirebaseError } from "firebase/app";

export function humanizeAuthError(err: unknown): string {
  if (!(err instanceof FirebaseError)) return "Não foi possível entrar. Tente novamente.";

  switch (err.code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail e senha não coincidem.";

    case "auth/invalid-email":
      return "E-mail inválido.";

    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente mais tarde.";

    case "auth/user-disabled":
      return "Conta desativada. Entre em contato com o suporte.";

    case "auth/network-request-failed":
      return "Falha de rede. Verifique sua conexão e tente novamente.";

    default:
      return "Não foi possível entrar agora. Tente novamente.";
  }
}
export function humanizeAuthErrorCode(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail e senha não coincidem.";

    case "auth/invalid-email":
      return "E-mail inválido.";

    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente mais tarde.";

    case "auth/user-disabled":
      return "Conta desativada. Entre em contato com o suporte.";

    case "auth/network-request-failed":
      return "Falha de rede. Verifique sua conexão e tente novamente.";

    default:
      return "Erro desconhecido. Tente novamente.";
  }
}