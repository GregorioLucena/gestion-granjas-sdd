'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/data-display/empty-state';
import { PaginationBar } from '@/components/data-display/pagination-bar';
import { RecordListItem } from '@/components/data-display/record-list-item';
import { useToast } from '@/components/feedback/toast';
import { Field, FormRequiredLegend, getInputClassName, inputClassName } from '@/components/forms/field';
import { FormActions, FormHeader, formShellClassName } from '@/components/forms/form-shell';
import { PasswordInput } from '@/components/forms/password-input';
import { Button } from '@/components/ui/button';
import { apiFetch, apiFetchPaginated, getApiErrorMessage } from '@/lib/api-client';
import {
  clearFieldError,
  getEmailFieldError,
  getPasswordFieldError,
  getRequiredFieldError,
  REQUIRED_FIELD_MESSAGE,
  type FieldErrors,
} from '@/lib/form-validation';
import { useScrollToFormOnEdit } from '@/lib/use-scroll-to-form-on-edit';
import { LIST_PAGE_SIZE } from '@gestion-granjas/shared/schemas/pagination.schemas';
import { PERMISOS, hasPermission } from '@gestion-granjas/shared/permissions';
import { useAuth } from '@/lib/auth-context';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { tenantContextFromUser } from '@/lib/tenant-context';

type UsuarioEstado = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
type UsuarioFiltro = UsuarioEstado | 'TODOS';

type Usuario = {
  id: string;
  nombre: string;
  apellido?: string | null;
  email: string;
  companiaId: string;
  companiaNombre?: string;
  estado: UsuarioEstado;
  granjaIds: string[];
  perfilIds: string[];
};

type Compania = { id: string; nombre: string };
type Granja = { id: string; nombre: string; companiaId: string };
type Perfil = { id: string; nombre: string; estadoRegistro: 'ACTIVO' | 'INACTIVO' };

type FormMode = { type: 'create' } | { type: 'edit'; item: Usuario };

const estadoFiltros: { value: UsuarioFiltro; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'INACTIVO', label: 'Inactivos' },
  { value: 'BLOQUEADO', label: 'Bloqueados' },
];

export default function UsuariosPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user: sessionUser } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filtro, setFiltro] = useState<UsuarioFiltro>('ACTIVO');
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companiaId, setCompaniaId] = useState('');
  const [granjaIds, setGranjaIds] = useState<string[]>([]);
  const [perfilIds, setPerfilIds] = useState<string[]>([]);
  const [estado, setEstado] = useState<UsuarioEstado>('ACTIVO');
  const [resetTarget, setResetTarget] = useState<Usuario | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isEditing = formMode?.type === 'edit';
  const editingItem = formMode?.type === 'edit' ? formMode.item : null;
  const formSectionRef = useScrollToFormOnEdit(formMode);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filtro]);

  const listQuery = useQuery({
    queryKey: ['usuarios', page, debouncedSearch, filtro],
    queryFn: () =>
      apiFetchPaginated<Usuario>('/usuarios', {
        page,
        limit: LIST_PAGE_SIZE,
        search: debouncedSearch || undefined,
        estado: filtro,
      }),
  });

  const companiasQuery = useQuery({
    queryKey: ['companias-select'],
    queryFn: () => apiFetchPaginated<Compania>('/companias', { limit: 100, estadoRegistro: 'ACTIVO' }),
  });

  const granjasQuery = useQuery({
    queryKey: ['granjas-select', companiaId],
    enabled: Boolean(companiaId),
    queryFn: () =>
      apiFetchPaginated<Granja>('/granjas', {
        limit: 100,
        estadoRegistro: 'ACTIVO',
        companiaId,
      }),
  });

  const perfilesQuery = useQuery({
    queryKey: ['perfiles-select'],
    queryFn: () => apiFetchPaginated<Perfil>('/perfiles', { limit: 100, estadoRegistro: 'ACTIVO' }),
  });

  useEffect(() => {
    if (!companiaId && sessionUser?.companiaId) {
      setCompaniaId(sessionUser.companiaId);
    }
  }, [companiaId, sessionUser?.companiaId]);

  function resetForm() {
    setFormMode(null);
    setNombre('');
    setApellido('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setCompaniaId(sessionUser?.companiaId ?? '');
    setGranjaIds([]);
    setPerfilIds([]);
    setEstado('ACTIVO');
    setFieldErrors({});
  }

  function loadForm(item: Usuario) {
    setNombre(item.nombre);
    setApellido(item.apellido ?? '');
    setEmail(item.email);
    setCompaniaId(item.companiaId);
    setGranjaIds(item.granjaIds);
    setPerfilIds(item.perfilIds);
    setEstado(item.estado);
    setPassword('');
    setConfirmPassword('');
    setFieldErrors({});
  }

  const crear = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<Usuario>('/usuarios', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      resetForm();
      toast.success('Usuario registrado correctamente.');
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo registrar el usuario.')),
  });

  const actualizar = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiFetch<Usuario>(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      resetForm();
      toast.success('Cambios guardados correctamente.');
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudieron guardar los cambios.')),
  });

  const restablecer = useMutation({
    mutationFn: ({ id, password: newPassword }: { id: string; password: string }) =>
      apiFetch(`/usuarios/${id}/restablecer-contrasena`, {
        method: 'POST',
        body: JSON.stringify({ password: newPassword }),
      }),
    onSuccess: () => {
      setResetTarget(null);
      setResetPassword('');
      setResetConfirm('');
      toast.success('Contrasena restablecida correctamente.');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'No se pudo restablecer la contrasena.')),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const errors: FieldErrors = {};
    const nombreError = getRequiredFieldError(nombre);
    if (nombreError) errors.nombre = nombreError;
    if (!isEditing) {
      const emailError = getRequiredFieldError(email) ?? getEmailFieldError(email);
      if (emailError) errors.email = emailError;
      const passwordError = getPasswordFieldError(password);
      if (passwordError) errors.password = passwordError;
      if (password !== confirmPassword) errors.confirmPassword = 'Las contrasenas no coinciden.';
    }
    if (!companiaId) errors.companiaId = REQUIRED_FIELD_MESSAGE;
    if (granjaIds.length === 0) errors.granjaIds = 'Selecciona al menos una granja.';
    if (perfilIds.length === 0) errors.perfilIds = 'Selecciona al menos un perfil.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    if (isEditing && editingItem) {
      actualizar.mutate({
        id: editingItem.id,
        payload: { nombre: nombre.trim(), apellido: apellido.trim() || undefined, granjaIds, perfilIds, estado },
      });
      return;
    }

    crear.mutate({
      nombre: nombre.trim(),
      apellido: apellido.trim() || undefined,
      email: email.trim(),
      password,
      companiaId,
      granjaIds,
      perfilIds,
      estado,
    });
  }

  function onResetPassword(event: FormEvent) {
    event.preventDefault();
    if (!resetTarget) return;
    const passwordError = getPasswordFieldError(resetPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    if (resetPassword !== resetConfirm) {
      toast.error('Las contrasenas no coinciden.');
      return;
    }
    restablecer.mutate({ id: resetTarget.id, password: resetPassword });
  }

  const usuarios = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta ?? { page: 1, limit: LIST_PAGE_SIZE, total: 0, totalPages: 1 };
  const granjas = granjasQuery.data?.items ?? [];
  const perfiles = (perfilesQuery.data?.items ?? []).filter((p) => p.estadoRegistro === 'ACTIVO');
  const tenantCtx = sessionUser ? tenantContextFromUser(sessionUser) : null;
  const canCreate = tenantCtx ? hasPermission(tenantCtx, PERMISOS.USUARIOS_CREAR) : false;
  const canEdit = tenantCtx ? hasPermission(tenantCtx, PERMISOS.USUARIOS_EDITAR) : false;

  return (
    <PermissionGuard permission={PERMISOS.USUARIOS_VER}>
    <div className="space-y-5 pb-24">
      <PageHeader
        backHref="/seguridad"
        backLabel="Seguridad"
        title="Usuarios"
        description="Administra cuentas, accesos por granja y perfiles."
      />

      <div className="rounded-2xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Resultados</p>
        <p className="mt-1 text-2xl font-bold text-primary">{meta.total}</p>
      </div>

      <div className="space-y-3 rounded-2xl bg-surface/95 p-4 shadow-sm ring-1 ring-primary/10">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className={`${inputClassName} pl-10`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {estadoFiltros.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFiltro(option.value)}
              className={`min-h-9 rounded-full px-3 text-sm font-medium ${
                filtro === option.value ? 'bg-primary text-white' : 'bg-background text-muted ring-1 ring-primary/10'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={formSectionRef} className="scroll-mt-20">
        {!formMode && canCreate ? (
          <Button
            type="button"
            fullWidth
            onClick={() => {
              resetForm();
              setFormMode({ type: 'create' });
            }}
          >
            Agregar usuario
          </Button>
        ) : null}
        {formMode && (formMode.type === 'create' ? canCreate : canEdit) ? (
          <form onSubmit={onSubmit} className={formShellClassName}>
            <FormHeader title={isEditing ? `Editar: ${editingItem?.nombre}` : 'Nuevo usuario'} />
            <FormRequiredLegend />
            <div className="space-y-4">
            <Field label="Nombre" htmlFor="nombre" required error={fieldErrors.nombre}>
              <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className={getInputClassName(Boolean(fieldErrors.nombre))} />
            </Field>
            <Field label="Apellido" htmlFor="apellido">
              <input id="apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} className={inputClassName} />
            </Field>
            {!isEditing ? (
              <>
                <Field label="Correo electronico" htmlFor="email" required error={fieldErrors.email}>
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={getInputClassName(Boolean(fieldErrors.email))} />
                </Field>
                <Field label="Contrasena" htmlFor="password" required error={fieldErrors.password}>
                  <PasswordInput
                    id="password"
                    value={password}
                    autoComplete="new-password"
                    hasError={Boolean(fieldErrors.password)}
                    onChange={(value) => {
                      setPassword(value);
                      clearFieldError('password', setFieldErrors);
                    }}
                  />
                </Field>
                <Field label="Confirmar contrasena" htmlFor="confirmPassword" required error={fieldErrors.confirmPassword}>
                  <PasswordInput
                    id="confirmPassword"
                    value={confirmPassword}
                    autoComplete="new-password"
                    hasError={Boolean(fieldErrors.confirmPassword)}
                    onChange={(value) => {
                      setConfirmPassword(value);
                      clearFieldError('confirmPassword', setFieldErrors);
                    }}
                  />
                </Field>
              </>
            ) : null}
            <Field label="Compania" htmlFor="companiaId" required error={fieldErrors.companiaId}>
              <select id="companiaId" value={companiaId} disabled={isEditing} onChange={(e) => { setCompaniaId(e.target.value); setGranjaIds([]); }} className={inputClassName}>
                <option value="">Seleccionar</option>
                {(companiasQuery.data?.items ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </Field>
            <Field label="Granjas permitidas" htmlFor="granjas" required error={fieldErrors.granjaIds}>
              <div className="space-y-2">
                {granjas.map((granja) => (
                  <label key={granja.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={granjaIds.includes(granja.id)}
                      onChange={(e) => setGranjaIds((prev) => e.target.checked ? [...prev, granja.id] : prev.filter((id) => id !== granja.id))}
                    />
                    {granja.nombre}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Perfiles" htmlFor="perfiles" required error={fieldErrors.perfilIds}>
              <div className="space-y-2">
                {perfiles.map((perfil) => (
                  <label key={perfil.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={perfilIds.includes(perfil.id)}
                      onChange={(e) => setPerfilIds((prev) => e.target.checked ? [...prev, perfil.id] : prev.filter((id) => id !== perfil.id))}
                    />
                    {perfil.nombre}
                  </label>
                ))}
              </div>
            </Field>
            {isEditing ? (
              <Field label="Estado" htmlFor="estado">
                <select id="estado" value={estado} onChange={(e) => setEstado(e.target.value as UsuarioEstado)} className={inputClassName}>
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                  <option value="BLOQUEADO">Bloqueado</option>
                </select>
              </Field>
            ) : null}
            </div>
            <FormActions
              onCancel={resetForm}
              submitLabel={isEditing ? 'Guardar cambios' : 'Registrar usuario'}
            />
            {isEditing && editingItem && canEdit ? (
              <Button
                type="button"
                variant="outline"
                fullWidth
                className="border-warning/30 bg-warning/10 text-warning hover:bg-warning/15"
                onClick={() => setResetTarget(editingItem)}
              >
                Restablecer contrasena
              </Button>
            ) : null}
          </form>
        ) : null}
      </div>

      {listQuery.isLoading ? <p className="text-sm text-muted">Cargando usuarios...</p> : null}
      {listQuery.isError ? <p className="text-sm text-danger">No se pudieron cargar los usuarios.</p> : null}
      {!listQuery.isLoading && usuarios.length === 0 ? (
        <EmptyState
          title="Sin usuarios"
          description={
            canCreate
              ? 'Agrega el primer usuario del sistema.'
              : 'No hay usuarios que coincidan con los filtros.'
          }
        />
      ) : null}

      <div className="space-y-3">
        {usuarios.map((usuario) => (
          <RecordListItem
            key={usuario.id}
            title={`${usuario.nombre}${usuario.apellido ? ` ${usuario.apellido}` : ''}`}
            estado={usuario.estado === 'ACTIVO' ? 'ACTIVO' : 'INACTIVO'}
            details={[
              { label: 'Correo', value: usuario.email },
              { label: 'Compania', value: usuario.companiaNombre ?? usuario.companiaId },
              { label: 'Estado', value: usuario.estado },
            ]}
            onEdit={
              canEdit
                ? () => {
                    setFormMode({ type: 'edit', item: usuario });
                    loadForm(usuario);
                  }
                : undefined
            }
          />
        ))}
      </div>

      <PaginationBar
        page={page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={meta.limit}
        onPageChange={setPage}
      />


      {resetTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
          <form onSubmit={onResetPassword} className={`w-full max-w-md ${formShellClassName}`}>
            <FormHeader title="Nueva contrasena" description={resetTarget.email} />
            <FormRequiredLegend />
            <div className="space-y-4">
              <Field label="Nueva contrasena" htmlFor="resetPassword" required>
                <PasswordInput
                  id="resetPassword"
                  value={resetPassword}
                  autoComplete="new-password"
                  onChange={setResetPassword}
                />
              </Field>
              <Field label="Confirmar contrasena" htmlFor="resetConfirm" required>
                <PasswordInput
                  id="resetConfirm"
                  value={resetConfirm}
                  autoComplete="new-password"
                  onChange={setResetConfirm}
                />
              </Field>
            </div>
            <FormActions
              onCancel={() => setResetTarget(null)}
              submitLabel="Restablecer"
            />
          </form>
        </div>
      ) : null}
    </div>
    </PermissionGuard>
  );
}
