import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { pwaService } from '../pwaService.js';

describe('pwaService', () => {
  beforeEach(() => {
    pwaService.deferredPrompt = null;
    pwaService.isInstalled = false;
    pwaService.registration = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default state', () => {
    const state = pwaService.getState();
    expect(state).toHaveProperty('canInstall');
    expect(state).toHaveProperty('isInstalled');
    expect(state).toHaveProperty('hasServiceWorker');
  });

  it('canInstall returns false when no deferredPrompt is available', () => {
    expect(pwaService.canInstall()).toBe(false);
  });

  it('canInstall returns true when deferredPrompt exists and not installed', () => {
    pwaService.deferredPrompt = {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' })
    };
    pwaService.isInstalled = false;
    expect(pwaService.canInstall()).toBe(true);
  });

  it('canInstall returns false if already installed even with deferredPrompt', () => {
    pwaService.deferredPrompt = {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' })
    };
    pwaService.isInstalled = true;
    expect(pwaService.canInstall()).toBe(false);
  });

  it('installApp calls prompt on deferredPrompt and returns success outcome', async () => {
    const promptMock = vi.fn();
    pwaService.deferredPrompt = {
      prompt: promptMock,
      userChoice: Promise.resolve({ outcome: 'accepted' })
    };

    const result = await pwaService.installApp();
    expect(promptMock).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(pwaService.deferredPrompt).toBeNull();
  });

  it('notifies subscribers on state change', () => {
    const listener = vi.fn();
    const unsubscribe = pwaService.subscribe(listener);

    pwaService.notify();
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        canInstall: expect.any(Boolean),
        isInstalled: expect.any(Boolean),
        hasServiceWorker: expect.any(Boolean)
      })
    );

    unsubscribe();
    listener.mockClear();
    pwaService.notify();
    expect(listener).not.toHaveBeenCalled();
  });
});
