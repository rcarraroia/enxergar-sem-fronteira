
export const getRedirectPath = (userRole: string | null): string => {
  switch (userRole) {
    case "admin":
    case "superadmin":
      return "/admin";
    case "organizer":
      return "/organizer";
    case "user":
    default:
      return "/";
  }
};

export const getDefaultDashboardPath = (userRole: string | null): string => {
  return getRedirectPath(userRole);
};

export const getRoleDisplayName = (userRole: string | null): string => {
  switch (userRole) {
    case "superadmin":
      return "Super Administrador";
    case "admin":
      return "Administrador";
    case "organizer":
      return "Organizador Local";
    case "user":
    default:
      return "Usuário";
  }
};
