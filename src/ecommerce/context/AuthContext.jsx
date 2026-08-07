import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../lib/api.js';

/*
 * Storefront session, backed by herbal-backend's /api/auth routes.
 *
 * Every method is async and resolves to { ok } or { ok: false, error } — the
 * account panels render that error inline, so nothing here throws.
 *
 * `ready` is false until the stored token has been exchanged for a profile, so
 * a returning customer does not see the sign-in form flash before their
 * dashboard appears.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!api.getToken()) {
        setReady(true);
        return;
      }
      const result = await api.me();
      if (cancelled) return;
      // A rejected token was already cleared by the API layer; anything else
      // (server down) simply leaves the visitor signed out for now.
      if (result.ok) setUser(result.user);
      setReady(true);
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => {
    async function login(email, password) {
      const result = await api.login((email || '').trim(), password);
      if (result.ok) setUser(result.user);
      return result;
    }

    async function signup(data) {
      const name = (data.name || '').trim();
      const email = (data.email || '').trim();
      const phone = (data.phone || '').trim();

      // Checked here as well as on the server so the form can answer instantly.
      if (!name || !email || !phone || !data.password) {
        return { ok: false, error: 'Please fill in all the required fields.' };
      }
      if (data.password.length < 6) {
        return { ok: false, error: 'Password must be at least 6 characters long.' };
      }

      const result = await api.register({
        name,
        email,
        phone,
        city: (data.city || '').trim(),
        password: data.password,
      });
      if (result.ok) setUser(result.user);
      return result;
    }

    function logout() {
      api.logout();
      setUser(null);
    }

    async function saveUser(patch) {
      const result = await api.updateProfile(patch);
      if (result.ok) setUser(result.user);
      return result;
    }

    async function changePassword(oldPass, newPass) {
      if (!newPass || newPass.length < 6) {
        return { ok: false, error: 'New password must be at least 6 characters.' };
      }
      return api.changePassword(oldPass, newPass);
    }

    /**
     * The address endpoints live in their own collection and answer with the
     * customer's list — not a whole user — so the result is merged into the
     * session rather than replacing it.
     */
    function mergeAddresses(result) {
      if (result.ok) setUser((prev) => (prev ? { ...prev, addresses: result.addresses } : prev));
      return result;
    }

    /**
     * Add or update one address. The server validates it, assigns the id and
     * decides which address is the default — the storefront no longer rebuilds
     * the list, so two tabs cannot overwrite each other's changes.
     */
    async function saveAddress(addr) {
      if (!user) return { ok: false, error: 'Please sign in first.' };
      return mergeAddresses(addr.id ? await api.updateAddress(addr.id, addr) : await api.createAddress(addr));
    }

    async function deleteAddress(id) {
      if (!user) return { ok: false, error: 'Please sign in first.' };
      return mergeAddresses(await api.deleteAddress(id));
    }

    async function setDefaultAddress(id) {
      if (!user) return { ok: false, error: 'Please sign in first.' };
      return mergeAddresses(await api.setDefaultAddress(id));
    }

    return {
      user,
      ready,
      login,
      signup,
      logout,
      saveUser,
      changePassword,
      saveAddress,
      deleteAddress,
      setDefaultAddress,
    };
  }, [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
