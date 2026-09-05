// Data Transfer Object (DTO) for system settings, representing the structure of a setting object that is sent to clients.
export function toSettingDto(setting: {
  id: number;
  key: string;
  value: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
    
// Returns a DTO representation of the provided setting object, converting date fields to ISO strings for client consumption.
  return {
    id: setting.id,
    key: setting.key,
    value: setting.value,
    description: setting.description,
    createdAt:
      setting.createdAt.toISOString(),
    updatedAt:
      setting.updatedAt.toISOString(),
  };
}