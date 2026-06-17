import { useState, useEffect } from 'react';
import { local } from '~/api-client/eden';

export interface AuthUser {
  id: string;
  email: string;
}

// Eden treaty types routes with complex generics that don't always resolve to
// the specific response shape. Cast explicitly using the known UserResponse fields.
type MeResponse = { id: string; email: string; [key: string]: unknown };

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    local.api.auth.me.get()
      .then(({ data }) => {
        const d = data as MeResponse | null;
        if (d?.id && d?.email) setUser({ id: d.id, email: d.email });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const register = async (email: string, password: string) => {
    const { data, error } = await (local.api.auth.register as any).post({ email, password });
    if (error) {
      const val = error.value as { error?: string } | string | null;
      const msg = typeof val === 'string' ? val : val?.error ?? 'Registration failed';
      throw new Error(msg);
    }
    const d = data as MeResponse | null;
    if (d?.id && d?.email) setUser({ id: d.id, email: d.email });
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await local.api.auth.login.post({ email, password });
    if (error) {
      const val = error.value as { error?: string } | string | null;
      const msg = typeof val === 'string' ? val : val?.error ?? 'Login failed';
      throw new Error(msg);
    }
    const d = data as MeResponse | null;
    if (d?.id && d?.email) setUser({ id: d.id, email: d.email });
  };

  const logout = async () => {
    await local.api.auth.logout.post(null as any);
    setUser(null);
  };

  return { user, loading, login, register, logout };
}
