const ROLE_ADMIN = "administrador";
const ROLE_EDITOR = "editor";

export function isAdminUser(user) {
  return user?.role === ROLE_ADMIN;
}

export function isEditorUser(user) {
  return user?.role === ROLE_EDITOR;
}

export function canManageContentItem(item, user, canEdit) {
  if (!canEdit) {
    return false;
  }

  if (isAdminUser(user)) {
    return true;
  }

  if (!isEditorUser(user)) {
    return false;
  }

  return !item || item.ownerUid === user?.uid;
}

export function getVisibleAdminItems(items, user, canEdit) {
  if (!Array.isArray(items)) {
    return [];
  }

  if (isEditorUser(user) && canEdit) {
    return items.filter((item) => item.ownerUid === user?.uid);
  }

  return items;
}

export function getEditorOwnershipNote(user, canEdit) {
  if (!isEditorUser(user) || !canEdit) {
    return "";
  }

  return "Rol editor: solo se muestran y gestionan los registros creados por tu usuario.";
}
