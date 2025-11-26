import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

vi.mock('@/contexts/UserContext', () => ({
  useUserContext: () => ({
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    startNewSession: vi.fn()
  })
}));

vi.mock('@/contexts/MediaEngineContext', () => ({
  useMediaEngineContext: () => ({
    currentMedia: null,
    gallery: [],
    currentIndex: 0,
    imageLoading: false,
    videoLoading: false,
    autoPaint: false,
    canPaintNew: false,
    quality: 'fast',
    setAutoPaint: vi.fn(),
    setQuality: vi.fn(),
    setScenePrompt: vi.fn(),
    generateImageForScene: vi.fn(),
    generateVideo: vi.fn(() => Promise.resolve(true)),
    regenerateCurrent: vi.fn(),
    nextImage: vi.fn(),
    prevImage: vi.fn()
  })
}));

vi.mock('@/components/StatusPanel', () => ({
  StatusPanel: ({ status }: { status: unknown }) => (
    <div data-testid="status-panel">{status ? 'Status loaded' : 'No status'}</div>
  )
}));

vi.mock('@/components/NarrativeDisplay', () => ({
  NarrativeDisplay: ({ response, isLoading }: { response: unknown; isLoading: boolean }) => (
    <div data-testid="narrative-display">
      {isLoading ? 'Loading...' : response ? 'Response loaded' : 'No response'}
    </div>
  )
}));

vi.mock('@/components/ActionPanel', () => ({
  ActionPanel: ({ disabled }: { disabled: boolean }) => (
    <div data-testid="action-panel">{disabled ? 'Disabled' : 'Enabled'}</div>
  )
}));

vi.mock('@/components/Visualizer', () => ({
  Visualizer: () => <div data-testid="visualizer">Visualizer</div>
}));

vi.mock('@/components/SettingsModal', () => ({
  SettingsModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? <div data-testid="settings-modal"><button onClick={onClose}>Close</button></div> : null
  )
}));

vi.mock('./hooks/useGameAgent', () => ({
  useGameAgent: () => ({
    history: [],
    lastResponse: null,
    loading: false,
    saveStatus: 'idle',
    gameStarted: false,
    lastAutoSave: null,
    questLog: [],
    questSystem: {
      activeQuest: null,
      questState: { quests: [], activeQuestId: null },
      setActiveQuest: vi.fn(),
      getQuestProgress: vi.fn(() => 0)
    },
    handleTurn: vi.fn(),
    saveGame: vi.fn(() => true),
    loadGame: vi.fn(() => false),
    startNewGame: vi.fn(),
    setGalleryRef: vi.fn()
  })
}));



describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as { aistudio?: unknown }).aistudio;
  });

  describe('with aistudio available - checking key', () => {
    it('shows initializing state while checking key', async () => {
      let resolveHasKey: (value: boolean) => void;
      const hasKeyPromise = new Promise<boolean>((resolve) => {
        resolveHasKey = resolve;
      });
      
      (window as { aistudio?: unknown }).aistudio = {
        hasSelectedApiKey: vi.fn(() => hasKeyPromise),
        openSelectKey: vi.fn(() => Promise.resolve())
      };

      render(<App />);
      
      expect(screen.getByText('Initializing System...')).toBeInTheDocument();
      
      resolveHasKey!(true);
      
      await waitFor(() => {
        expect(screen.getByText('ISEKAI ENGINE')).toBeInTheDocument();
      });
    });

    it('shows authentication required when no API key', async () => {
      (window as { aistudio?: unknown }).aistudio = {
        hasSelectedApiKey: vi.fn(() => Promise.resolve(false)),
        openSelectKey: vi.fn(() => Promise.resolve())
      };

      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('AUTHENTICATION REQUIRED')).toBeInTheDocument();
      });
    });

    it('shows connect neural link button when no API key', async () => {
      (window as { aistudio?: unknown }).aistudio = {
        hasSelectedApiKey: vi.fn(() => Promise.resolve(false)),
        openSelectKey: vi.fn(() => Promise.resolve())
      };

      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('CONNECT NEURAL LINK')).toBeInTheDocument();
      });
    });

    it('calls openSelectKey when connect button clicked', async () => {
      const openSelectKeyMock = vi.fn(() => Promise.resolve());
      (window as { aistudio?: unknown }).aistudio = {
        hasSelectedApiKey: vi.fn(() => Promise.resolve(false)),
        openSelectKey: openSelectKeyMock
      };

      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('CONNECT NEURAL LINK')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('CONNECT NEURAL LINK'));
      
      await waitFor(() => {
        expect(openSelectKeyMock).toHaveBeenCalled();
      });
    });
  });

  describe('without aistudio (standalone mode)', () => {
    beforeEach(() => {
      delete (window as { aistudio?: unknown }).aistudio;
    });

    it('renders main app interface immediately', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('ISEKAI ENGINE')).toBeInTheDocument();
      });
    });

    it('renders header with version', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('System Online v3.1')).toBeInTheDocument();
      });
    });

    it('renders status panel', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('status-panel')).toBeInTheDocument();
      });
    });

    it('renders narrative display', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('narrative-display')).toBeInTheDocument();
      });
    });

    it('renders action panel', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('action-panel')).toBeInTheDocument();
      });
    });

    it('renders visualizer', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('visualizer')).toBeInTheDocument();
      });
    });

    it('renders settings button', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTitle('System Settings')).toBeInTheDocument();
      });
    });

    it('opens settings modal when settings button clicked', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTitle('System Settings')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('System Settings'));
      
      expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
    });

    it('closes settings modal when close clicked', async () => {
      render(<App />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByTitle('System Settings'));
      });

      fireEvent.click(screen.getByText('Close'));
      
      expect(screen.queryByTestId('settings-modal')).not.toBeInTheDocument();
    });

    it('does not show auto-save when lastAutoSave is null', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('ISEKAI ENGINE')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Auto-saved/)).not.toBeInTheDocument();
    });
  });

  describe('with aistudio - has key', () => {
    beforeEach(() => {
      (window as { aistudio?: unknown }).aistudio = {
        hasSelectedApiKey: vi.fn(() => Promise.resolve(true)),
        openSelectKey: vi.fn(() => Promise.resolve())
      };
    });

    it('checks for API key on mount', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect((window as { aistudio: { hasSelectedApiKey: () => Promise<boolean> } }).aistudio.hasSelectedApiKey).toHaveBeenCalled();
      });
    });

    it('renders app when API key exists', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('ISEKAI ENGINE')).toBeInTheDocument();
      });
    });
  });

  describe('header buttons', () => {
    beforeEach(() => {
      delete (window as { aistudio?: unknown }).aistudio;
    });

    it('renders save button disabled when no response', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('ISEKAI ENGINE')).toBeInTheDocument();
      });

      const saveButtons = screen.getAllByRole('button');
      const saveButton = saveButtons.find(btn => btn.textContent?.includes('Save'));
      expect(saveButton).toBeDisabled();
    });

    it('renders load button', async () => {
      render(<App />);
      
      await waitFor(() => {
        const loadButton = screen.getByRole('button', { name: /load/i });
        expect(loadButton).toBeInTheDocument();
      });
    });

    it('renders restart button', async () => {
      render(<App />);
      
      await waitFor(() => {
        const restartButton = screen.getByRole('button', { name: /restart/i });
        expect(restartButton).toBeInTheDocument();
      });
    });
  });
});
