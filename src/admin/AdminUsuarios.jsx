import { useEffect, useMemo, useState } from "react";
import { FaSave, FaTrash, FaUserShield } from "react-icons/fa";
import { useAuth } from "../context/useAuth";

const initialForm = {
  displayName: "",
  email: "",
  password: "",
  role: "visualizador",
};

const roleOptions = [
  { value: "administrador", label: "Administrador" },
  { value: "editor", label: "Editor" },
  { value: "visualizador", label: "Visualizador" },
];

function getRoleLabel(role) {
  return roleOptions.find((option) => option.value === role)?.label || role;
}

function hasChanges(form) {
  return Boolean(form.displayName || form.email || form.password);
}

export default function AdminUsuarios({
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const {
    user,
    users,
    createUser,
    updateUserRole,
    deleteUser,
    canManageUsers,
  } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const adminCount = useMemo(
    () => users.filter((entry) => entry.role === "administrador").length,
    [users],
  );

  const handleCreate = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!canManageUsers) {
      setError("Solo un administrador puede crear usuarios.");
      return;
    }

    try {
      createUser(form);
      setSuccess("Usuario creado correctamente.");
      setForm(initialForm);
    } catch (creationError) {
      setError(creationError.message || "No se pudo crear el usuario.");
    }
  };

  const handleRoleChange = (uid, role) => {
    setError("");
    setSuccess("");

    try {
      updateUserRole(uid, role);
      setSuccess("Rol actualizado correctamente.");
    } catch (updateError) {
      setError(updateError.message || "No se pudo actualizar el rol.");
    }
  };

  const handleDelete = (uid) => {
    setError("");
    setSuccess("");

    if (!confirm("¿Eliminar este usuario?")) {
      return;
    }

    try {
      deleteUser(uid);
      setSuccess("Usuario eliminado correctamente.");
    } catch (deleteError) {
      setError(deleteError.message || "No se pudo eliminar el usuario.");
    }
  };

  useEffect(() => {
    onDirtyChange(hasChanges(form));
  }, [form, onDirtyChange]);

  useEffect(() => {
    onLivePreviewChange({
      section: "usuarios",
      path: "/admin",
      image:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900",
      badge: "Roles y permisos",
      title: `Usuarios registrados: ${users.length}`,
      subtitle: `Administradores activos: ${adminCount}`,
      body: canManageUsers
        ? "Puedes crear usuarios y asignar roles del sistema."
        : "Tienes acceso de consulta a usuarios y roles.",
      status: canManageUsers ? "Administración habilitada" : "Solo lectura",
    });
  }, [users.length, adminCount, canManageUsers, onLivePreviewChange]);

  useEffect(
    () => () => {
      onDirtyChange(false);
      onLivePreviewChange(null);
    },
    [onDirtyChange, onLivePreviewChange],
  );

  return (
    <div>
      <div className="admin-table-card" style={{ marginBottom: "1rem" }}>
        <div className="admin-table-header">
          <h2>
            <FaUserShield className="inline-icon" aria-hidden="true" />
            Gestión de Roles ({users.length})
          </h2>
        </div>

        <div className="admin-users-meta">
          <span>Usuario activo: {user?.displayName || user?.email}</span>
          <span>Rol actual: {getRoleLabel(user?.role)}</span>
          <span>Administradores: {adminCount}</span>
        </div>

        {!canManageUsers && (
          <div className="admin-readonly-note">
            Solo los administradores pueden crear usuarios o cambiar permisos.
          </div>
        )}

        {error && <div className="login-error">{error}</div>}
        {success && <div className="admin-success-note">{success}</div>}

        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((entry) => (
              <tr key={entry.uid}>
                <td>
                  <strong>{entry.displayName}</strong>
                </td>
                <td>{entry.email || "No disponible"}</td>
                <td>
                  <select
                    value={entry.role}
                    onChange={(e) =>
                      handleRoleChange(entry.uid, e.target.value)
                    }
                    disabled={!canManageUsers}
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    className="action-btn del-btn"
                    onClick={() => handleDelete(entry.uid)}
                    disabled={!canManageUsers || entry.uid === user?.uid}
                  >
                    <FaTrash className="inline-icon" aria-hidden="true" />
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-table-card">
        <div className="admin-table-header">
          <h2>Crear Usuario</h2>
        </div>

        <form className="admin-user-form" onSubmit={handleCreate}>
          <div className="modal-field">
            <label>Nombre</label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) =>
                setForm({ ...form, displayName: e.target.value })
              }
              placeholder="Ej: Editor Turismo"
              disabled={!canManageUsers}
              required
            />
          </div>

          <div className="modal-field">
            <label>Correo</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="usuario@santarosa.ec"
              disabled={!canManageUsers}
              required
            />
          </div>

          <div className="modal-field">
            <label>Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo recomendado: 8 caracteres"
              disabled={!canManageUsers}
              required
            />
          </div>

          <div className="modal-field">
            <label>Rol</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              disabled={!canManageUsers}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={!canManageUsers}
            >
              <FaSave className="inline-icon" aria-hidden="true" />
              Crear Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
