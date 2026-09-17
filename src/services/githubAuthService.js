export class GitHubAuthService {
  constructor() {
    this.authBaseUrl = 'https://github.com/login/oauth/authorize';
    this.tokenEndpoint = 'https://github.com/login/oauth/access_token';
  }

  getTokenEndpoint() {
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return '/api/github/oauth/token';
      }
      if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GITHUB_AUTH_PROXY_URL) {
        return import.meta.env.VITE_GITHUB_AUTH_PROXY_URL;
      }
    }
    return this.tokenEndpoint;
  }

  generateRandomString(length = 64) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const randomValues = new Uint8Array(length);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(randomValues);
    } else {
      for (let i = 0; i < length; i++) {
        randomValues[i] = Math.floor(Math.random() * 256);
      }
    }
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[randomValues[i] % charset.length];
    }
    return result;
  }

  base64UrlEncode(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  async generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const cryptoSubtle =
      (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) ||
      (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle);

    if (!cryptoSubtle) {
      throw new Error('Web Crypto API (subtle) no disponible en este entorno.');
    }

    const digest = await cryptoSubtle.digest('SHA-256', data);
    return this.base64UrlEncode(digest);
  }

  getEffectiveRedirectUri(redirectUri) {
    if (redirectUri) return redirectUri;
    if (typeof window !== 'undefined') {
      const isElectron =
        window.location.protocol === 'file:' ||
        (typeof window.require === 'function' && Boolean(window.require('electron')));
      if (isElectron) {
        return 'https://www.justneki.com/Escriba/';
      }
      return window.location.origin + window.location.pathname;
    }
    return 'https://www.justneki.com/Escriba/';
  }

  async startOAuthLogin({ clientId, redirectUri, repoName = 'escriba-notes' }) {
    if (!clientId) {
      throw new Error('No se ha configurado el Client ID de la GitHub App.');
    }

    const effectiveRedirectUri = this.getEffectiveRedirectUri(redirectUri);

    const codeVerifier = this.generateRandomString(64);
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const state = this.generateRandomString(32);

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('github_oauth_code_verifier', codeVerifier);
      sessionStorage.setItem('github_oauth_state', state);
      sessionStorage.setItem('github_oauth_redirect_uri', effectiveRedirectUri);
      sessionStorage.setItem('github_oauth_repo_name', repoName);
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: effectiveRedirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state
    });

    const targetUrl = `${this.authBaseUrl}?${params.toString()}`;

    if (typeof window !== 'undefined' && typeof window.require === 'function') {
      try {
        const electron = window.require('electron');
        if (electron && electron.ipcRenderer) {
          const authResult = await electron.ipcRenderer.invoke('github-oauth-open-popup', {
            authUrl: targetUrl,
            redirectUri: effectiveRedirectUri
          });
          return authResult;
        }
      } catch (ipcErr) {
        if (ipcErr.message && !ipcErr.message.includes('No handler')) {
          throw ipcErr;
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.location.assign(targetUrl);
    }

    return targetUrl;
  }

  async exchangeCodeForToken({ code, state, clientId, redirectUri }) {
    if (!code) {
      throw new Error('Código de autorización no provisto.');
    }

    let savedState = null;
    let codeVerifier = null;
    let savedRedirectUri = null;
    let repoName = 'escriba-notes';

    if (typeof sessionStorage !== 'undefined') {
      savedState = sessionStorage.getItem('github_oauth_state');
      codeVerifier = sessionStorage.getItem('github_oauth_code_verifier');
      savedRedirectUri = sessionStorage.getItem('github_oauth_redirect_uri');
      repoName = sessionStorage.getItem('github_oauth_repo_name') || 'escriba-notes';
    }

    if (savedState && state && savedState !== state) {
      this.clearSessionStorage();
      throw new Error('Estado de autenticación inválido (verificación CSRF fallida).');
    }

    if (!codeVerifier) {
      this.clearSessionStorage();
      throw new Error('No se encontró el verificador de código (code_verifier) de PKCE.');
    }

    const effectiveRedirectUri =
      redirectUri ||
      savedRedirectUri ||
      this.getEffectiveRedirectUri();

    try {
      if (typeof window !== 'undefined' && window.require) {
        try {
          const electron = window.require('electron');
          if (electron && electron.ipcRenderer) {
            const data = await electron.ipcRenderer.invoke('github-oauth-token', {
              client_id: clientId,
              code,
              code_verifier: codeVerifier,
              redirect_uri: effectiveRedirectUri,
              proxy_url: this.getTokenEndpoint()
            });
            if (data) {
              if (data.error) {
                throw new Error(data.error_description || data.error);
              }
              if (data.access_token) {
                this.clearSessionStorage();
                return {
                  accessToken: data.access_token,
                  tokenType: data.token_type || 'bearer',
                  scope: data.scope || '',
                  repoName
                };
              }
            }
          }
        } catch (ipcErr) {
          if (ipcErr.message && !ipcErr.message.includes('No handler')) {
            throw ipcErr;
          }
        }
      }

      const endpoint = this.getTokenEndpoint();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          code,
          code_verifier: codeVerifier,
          redirect_uri: effectiveRedirectUri
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const errorDesc = data.error_description || data.error || `HTTP ${response.status}`;
        throw new Error(`Error en autenticación de GitHub: ${errorDesc}`);
      }

      if (!data.access_token) {
        throw new Error('No se recibió access_token desde GitHub.');
      }

      this.clearSessionStorage();

      return {
        accessToken: data.access_token,
        tokenType: data.token_type || 'bearer',
        scope: data.scope || '',
        repoName
      };
    } catch (err) {
      this.clearSessionStorage();
      throw err;
    }
  }

  clearSessionStorage() {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('github_oauth_code_verifier');
      sessionStorage.removeItem('github_oauth_state');
      sessionStorage.removeItem('github_oauth_redirect_uri');
      sessionStorage.removeItem('github_oauth_repo_name');
    }
  }
}

export const gitHubAuthService = new GitHubAuthService();
