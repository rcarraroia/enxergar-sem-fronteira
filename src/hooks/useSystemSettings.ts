export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export const useSystemSettings = () => {
  const settings: SystemSetting[] = [];
  
  const getSettingValue = (_key: string, defaultValue?: string) => defaultValue || "";
  const getSettingJSON = (_key: string, defaultValue?: any) => defaultValue || {};
  
  return {
    settings,
    loading: false,
    isLoading: false,
    isUpdating: false,
    error: null,
    getSettingValue,
    getSettingJSON,
    updateSetting: async (_key: string, _value: string) => {},
    refetch: async () => {}
  };
};