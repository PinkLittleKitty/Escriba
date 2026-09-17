import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gitHubAuthService } from '../githubAuthService.js';
import { gitHubService } from '../githubService.js';

describe('GitHubAuthService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  describe('generateRandomString', () => {
    it('generates a string with requested length using URL-safe characters', () => {
      const str = gitHubAuthService.generateRandomString(43);
      expect(str).toHaveLength(43);
      expect(str).toMatch(/^[A-Za-z0-9\-_.~]+$/);
    });

    it('generates unique random strings', () => {
      const str1 = gitHubAuthService.generateRandomString(64);
      const str2 = gitHubAuthService.generateRandomString(64);
      expect(str1).not.toBe(str2);
    });
  });

  describe('base64UrlEncode', () => {
    it('encodes ArrayBuffer to base64url without +, / or =', () => {
      const buffer = new Uint8Array([251, 255, 254, 253]).buffer;
      const encoded = gitHubAuthService.base64UrlEncode(buffer);
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');
    });
  });

  describe('generateCodeChallenge', () => {
    it('produces a valid SHA-256 base64url hash of the verifier', async () => {
      const verifier = 'test-verifier-1234567890-abcdefghijklmnopqrstuvwxyz';
      const challenge = await gitHubAuthService.generateCodeChallenge(verifier);
      expect(challenge).toBeTypeOf('string');
      expect(challenge.length).toBeGreaterThan(20);
      expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);
    });
  });

  describe('startOAuthLogin', () => {
    it('throws an error if clientId is missing', async () => {
      await expect(gitHubAuthService.startOAuthLogin({ clientId: '' })).rejects.toThrow(
        /No se ha configurado el Client ID/
      );
    });

    it('stores verifier and state in sessionStorage and returns authorize URL', async () => {
      const assignMock = vi.fn();
      delete window.location;
      window.location = {
        origin: 'http://localhost:5173',
        pathname: '/',
        assign: assignMock
      };

      const authUrl = await gitHubAuthService.startOAuthLogin({
        clientId: 'Iv1.test_client_id',
        repoName: 'my-custom-notes'
      });

      expect(authUrl).toContain('https://github.com/login/oauth/authorize');
      expect(authUrl).toContain('client_id=Iv1.test_client_id');
      expect(authUrl).toContain('code_challenge_method=S256');

      expect(sessionStorage.getItem('github_oauth_code_verifier')).toBeTruthy();
      expect(sessionStorage.getItem('github_oauth_state')).toBeTruthy();
      expect(sessionStorage.getItem('github_oauth_repo_name')).toBe('my-custom-notes');
      expect(assignMock).toHaveBeenCalledWith(authUrl);
    });
  });

  describe('exchangeCodeForToken', () => {
    it('fails if code is missing', async () => {
      await expect(
        gitHubAuthService.exchangeCodeForToken({ code: '', state: 'xyz', clientId: 'c1' })
      ).rejects.toThrow(/Código de autorización no provisto/);
    });

    it('fails if state does not match stored state (CSRF protection)', async () => {
      sessionStorage.setItem('github_oauth_state', 'expected-state');
      sessionStorage.setItem('github_oauth_code_verifier', 'dummy-verifier');

      await expect(
        gitHubAuthService.exchangeCodeForToken({
          code: 'gh-code-123',
          state: 'attacker-state',
          clientId: 'c1'
        })
      ).rejects.toThrow(/verificación CSRF fallida/);

      expect(sessionStorage.getItem('github_oauth_code_verifier')).toBeNull();
    });

    it('fails if code_verifier is not found in sessionStorage', async () => {
      sessionStorage.setItem('github_oauth_state', 'valid-state');

      await expect(
        gitHubAuthService.exchangeCodeForToken({
          code: 'gh-code-123',
          state: 'valid-state',
          clientId: 'c1'
        })
      ).rejects.toThrow(/code_verifier/);
    });

    it('exchanges code for access token and clears session on success', async () => {
      sessionStorage.setItem('github_oauth_state', 'valid-state');
      sessionStorage.setItem('github_oauth_code_verifier', 'valid-verifier-123');
      sessionStorage.setItem('github_oauth_repo_name', 'notes-public');
      sessionStorage.setItem('github_oauth_redirect_uri', 'http://localhost:5173/');

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'ghu_user_access_token_xyz',
          token_type: 'bearer',
          scope: 'repo'
        })
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await gitHubAuthService.exchangeCodeForToken({
        code: 'auth-code-789',
        state: 'valid-state',
        clientId: 'Iv1.app_client_id'
      });

      expect(result.accessToken).toBe('ghu_user_access_token_xyz');
      expect(result.repoName).toBe('notes-public');

      expect(mockFetch).toHaveBeenCalledWith(
        gitHubAuthService.getTokenEndpoint(),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            client_id: 'Iv1.app_client_id',
            code: 'auth-code-789',
            code_verifier: 'valid-verifier-123',
            redirect_uri: 'http://localhost:5173/'
          })
        })
      );

      expect(sessionStorage.getItem('github_oauth_code_verifier')).toBeNull();
      expect(sessionStorage.getItem('github_oauth_state')).toBeNull();
    });
  });
});

describe('GitHubService ensureRepository', () => {
  it('creates repository as PUBLIC (private: false) when repo does not exist', async () => {
    const mockFetch = vi.fn();
    mockFetch.mockResolvedValueOnce({
      status: 404,
      ok: false
    });
    mockFetch.mockResolvedValueOnce({
      status: 201,
      ok: true,
      json: async () => ({ id: 999, name: 'escriba-notes', private: false })
    });

    vi.stubGlobal('fetch', mockFetch);

    await gitHubService.ensureRepository('mock-token', 'testuser', 'escriba-notes');

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const createCallArgs = mockFetch.mock.calls[1];
    expect(createCallArgs[0]).toBe('https://api.github.com/user/repos');
    const requestBody = JSON.parse(createCallArgs[1].body);
    expect(requestBody.name).toBe('escriba-notes');
    expect(requestBody.private).toBe(false);
  });
});
