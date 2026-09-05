export function toUserDto(user: {
  id: number;
  username: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  role: {
    id: number;
    name: string;
  };
}) {
  return {
    id: user.id,
    username: user.username,
    isActive: user.isActive,

    role: {
      id: user.role.id,
      name: user.role.name,
    },

    createdAt:
      user.createdAt.toISOString(),

    updatedAt:
      user.updatedAt.toISOString(),
  };
}