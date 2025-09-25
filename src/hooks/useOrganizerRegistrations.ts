export const useOrganizerRegistrations = () => {
  return {
    registrations: [],
    stats: { total: 0, confirmed: 0, pending: 0 },
    loading: false,
    error: null,
    refetch: async () => {}
  };
};