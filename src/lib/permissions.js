export const ACCESS_ROLES = {
  sysadmin: { label: 'Sysadmin',      badge: 'bg-purple-100 text-purple-700', level: 4 },
  admin:    { label: 'Admin',          badge: 'bg-blue-100 text-blue-700',     level: 3 },
  editor:   { label: 'Editor',         badge: 'bg-green-100 text-green-700',   level: 2 },
  viewer:   { label: 'Visualizador',   badge: 'bg-gray-100 text-gray-600',     level: 1 },
}

export function getPermissions(accessRole) {
  const level = ACCESS_ROLES[accessRole]?.level || 1
  return {
    canAdd:           level >= 2,
    canEdit:          level >= 3,
    canDelete:        level >= 3,
    canInvite:        level >= 4,
    canManageUsers:   level >= 4,
    canManageAccount: level >= 4,
    canEditChild:     level >= 4,
  }
}
