export type UserRole = "admin" | "organizer" | "user";

export const useRoles = () => {
  const hasRole = (_role: UserRole) => false;
  const hasPermission = (_permission: string) => false;
  
  return {
    userRole: "user" as UserRole,
    isAdmin: false,
    isOrganizer: false,
    loading: false,
    hasRole,
    hasPermission,
    checkUserRole: async () => {},
    assignRole: async () => {}
  };
};