
export const getRedirectPath = (userRole: string | null): string => {
  switch (userRole) {
    case 'admin':
      return '/admin'
    case 'organizer':
      return '/organizer'
    case 'user':
    default:
      return '/'
  }
}

export const getDefaultDashboardPath = (userRole: string | null): string => {
  return getRedirectPath(userRole)
}
