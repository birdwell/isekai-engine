import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppHeader } from './index';

// Access the module to test formatAutoSaveTime
vi.mock('lucide-react', () => ({
  Terminal: () => <span data-testid="terminal-icon" />,
  Save: () => <span data-testid="save-icon" />,
  RotateCcw: () => <span data-testid="restart-icon" />,
  CheckCircle: () => <span data-testid="check-icon" />,
  FolderOpen: () => <span data-testid="folder-icon" />,
  Settings: () => <span data-testid="settings-icon" />,
  Cloud: () => <span data-testid="cloud-icon" />,
}));

describe('AppHeader', () => {
  const defaultProps = {
    lastAutoSave: null,
    saveStatus: 'idle' as const,
    canSave: true,
    loading: false,
    onOpenSettings: vi.fn(),
    onSave: vi.fn(),
    onLoad: vi.fn(),
    onNewGame: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the app title "ISEKAI ENGINE"', () => {
    render(<AppHeader {...defaultProps} />);
    expect(screen.getByText('ISEKAI ENGINE')).toBeInTheDocument();
  });

  it('renders save/load/restart buttons', () => {
    render(<AppHeader {...defaultProps} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Load')).toBeInTheDocument();
    expect(screen.getByText('Restart')).toBeInTheDocument();
  });

  it('calls onOpenSettings when settings clicked', () => {
    render(<AppHeader {...defaultProps} />);
    const settingsButton = screen.getByTitle('System Settings');
    fireEvent.click(settingsButton);
    expect(defaultProps.onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('calls onSave when save clicked', () => {
    render(<AppHeader {...defaultProps} />);
    const saveButton = screen.getByText('Save').closest('button')!;
    fireEvent.click(saveButton);
    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onLoad when load clicked', () => {
    render(<AppHeader {...defaultProps} />);
    const loadButton = screen.getByText('Load').closest('button')!;
    fireEvent.click(loadButton);
    expect(defaultProps.onLoad).toHaveBeenCalledTimes(1);
  });

  it('calls onNewGame when restart clicked', () => {
    render(<AppHeader {...defaultProps} />);
    const restartButton = screen.getByText('Restart').closest('button')!;
    fireEvent.click(restartButton);
    expect(defaultProps.onNewGame).toHaveBeenCalledTimes(1);
  });

  it('disables save button when canSave is false', () => {
    render(<AppHeader {...defaultProps} canSave={false} />);
    const saveButton = screen.getByText('Save').closest('button')!;
    expect(saveButton).toBeDisabled();
  });

  it('disables save button when loading is true', () => {
    render(<AppHeader {...defaultProps} loading={true} />);
    const saveButton = screen.getByText('Save').closest('button')!;
    expect(saveButton).toBeDisabled();
  });

  it('shows "Saved" when saveStatus is saved', () => {
    render(<AppHeader {...defaultProps} saveStatus="saved" />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('shows "Saving" when saveStatus is saving', () => {
    render(<AppHeader {...defaultProps} saveStatus="saving" />);
    expect(screen.getByText('Saving')).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('shows auto-save time when lastAutoSave is provided', () => {
    const recentTimestamp = Date.now() - 30000; // 30 seconds ago
    render(<AppHeader {...defaultProps} lastAutoSave={recentTimestamp} />);
    expect(screen.getByText('Auto-saved just now')).toBeInTheDocument();
  });
});

describe('formatAutoSaveTime', () => {
  // We need to test the function indirectly through the component
  // since it's not exported

  it('returns null for null timestamp (no auto-save display)', () => {
    render(
      <AppHeader
        lastAutoSave={null}
        saveStatus="idle"
        canSave={true}
        loading={false}
        onOpenSettings={vi.fn()}
        onSave={vi.fn()}
        onLoad={vi.fn()}
        onNewGame={vi.fn()}
      />
    );
    expect(screen.queryByText(/Auto-saved/)).not.toBeInTheDocument();
  });

  it('returns "just now" for timestamps less than 60 seconds ago', () => {
    const timestamp = Date.now() - 30000; // 30 seconds ago
    render(
      <AppHeader
        lastAutoSave={timestamp}
        saveStatus="idle"
        canSave={true}
        loading={false}
        onOpenSettings={vi.fn()}
        onSave={vi.fn()}
        onLoad={vi.fn()}
        onNewGame={vi.fn()}
      />
    );
    expect(screen.getByText('Auto-saved just now')).toBeInTheDocument();
  });

  it('returns "{minutes}m ago" for timestamps 60+ seconds ago', () => {
    const timestamp = Date.now() - 180000; // 3 minutes ago
    render(
      <AppHeader
        lastAutoSave={timestamp}
        saveStatus="idle"
        canSave={true}
        loading={false}
        onOpenSettings={vi.fn()}
        onSave={vi.fn()}
        onLoad={vi.fn()}
        onNewGame={vi.fn()}
      />
    );
    expect(screen.getByText('Auto-saved 3m ago')).toBeInTheDocument();
  });
});
