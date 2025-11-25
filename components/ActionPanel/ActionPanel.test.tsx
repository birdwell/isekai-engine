import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionInput } from './ActionInput';
import { ChoiceButton } from './ChoiceButton';
import { ChoicesGrid } from './ChoicesGrid';
import { ActionPanel } from './index';
import { Choice } from '@/types';

vi.mock('@/utils/markdown', () => ({
  renderMarkdown: (text: string) => text
}));

describe('ActionInput', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders input and submit button', () => {
    render(<ActionInput onSubmit={mockOnSubmit} disabled={false} />);
    expect(screen.getByPlaceholderText('Declare your action...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument();
  });

  it('calls onSubmit with input value on submit', () => {
    render(<ActionInput onSubmit={mockOnSubmit} disabled={false} />);
    const input = screen.getByPlaceholderText('Declare your action...');
    fireEvent.change(input, { target: { value: 'Attack the dragon' } });
    fireEvent.submit(input.closest('form')!);
    expect(mockOnSubmit).toHaveBeenCalledWith('Attack the dragon');
  });

  it('clears input after submit', () => {
    render(<ActionInput onSubmit={mockOnSubmit} disabled={false} />);
    const input = screen.getByPlaceholderText('Declare your action...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Cast spell' } });
    fireEvent.submit(input.closest('form')!);
    expect(input.value).toBe('');
  });

  it('does not submit when input is empty', () => {
    render(<ActionInput onSubmit={mockOnSubmit} disabled={false} />);
    const input = screen.getByPlaceholderText('Declare your action...');
    fireEvent.submit(input.closest('form')!);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('does not submit when input is only whitespace', () => {
    render(<ActionInput onSubmit={mockOnSubmit} disabled={false} />);
    const input = screen.getByPlaceholderText('Declare your action...');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form')!);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('disables input when disabled prop is true', () => {
    render(<ActionInput onSubmit={mockOnSubmit} disabled={true} />);
    const input = screen.getByPlaceholderText('Waiting for narrator...');
    expect(input).toBeDisabled();
  });

  it('disables submit button when disabled prop is true', () => {
    render(<ActionInput onSubmit={mockOnSubmit} disabled={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('ChoiceButton', () => {
  const mockChoice: Choice = { id: '1', text: 'Attack with sword' };
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders choice id and text', () => {
    render(<ChoiceButton choice={mockChoice} onClick={mockOnClick} disabled={false} />);
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('Attack with sword')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    render(<ChoiceButton choice={mockChoice} onClick={mockOnClick} disabled={false} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled state', () => {
    render(<ChoiceButton choice={mockChoice} onClick={mockOnClick} disabled={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(mockOnClick).not.toHaveBeenCalled();
  });
});

describe('ChoicesGrid', () => {
  const mockChoices: Choice[] = [
    { id: '1', text: 'Fight' },
    { id: '2', text: 'Run' },
    { id: '3', text: 'Hide' }
  ];
  const mockOnChoiceSelect = vi.fn();

  beforeEach(() => {
    mockOnChoiceSelect.mockClear();
  });

  it('returns null when choices array is empty', () => {
    const { container } = render(
      <ChoicesGrid choices={[]} onChoiceSelect={mockOnChoiceSelect} disabled={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders all choices', () => {
    render(<ChoicesGrid choices={mockChoices} onChoiceSelect={mockOnChoiceSelect} disabled={false} />);
    expect(screen.getByText('Fight')).toBeInTheDocument();
    expect(screen.getByText('Run')).toBeInTheDocument();
    expect(screen.getByText('Hide')).toBeInTheDocument();
  });

  it('calls onChoiceSelect with choice text when clicked', () => {
    render(<ChoicesGrid choices={mockChoices} onChoiceSelect={mockOnChoiceSelect} disabled={false} />);
    fireEvent.click(screen.getByText('Run'));
    expect(mockOnChoiceSelect).toHaveBeenCalledWith('Run');
  });

  it('passes disabled prop to ChoiceButton', () => {
    render(<ChoicesGrid choices={mockChoices} onChoiceSelect={mockOnChoiceSelect} disabled={true} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });
});

describe('ActionPanel', () => {
  const mockChoices: Choice[] = [
    { id: '1', text: 'Option A' },
    { id: '2', text: 'Option B' }
  ];
  const mockOnChoiceSelect = vi.fn();

  beforeEach(() => {
    mockOnChoiceSelect.mockClear();
  });

  it('renders ChoicesGrid with choices', () => {
    render(<ActionPanel choices={mockChoices} onChoiceSelect={mockOnChoiceSelect} disabled={false} />);
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('renders ActionInput', () => {
    render(<ActionPanel choices={mockChoices} onChoiceSelect={mockOnChoiceSelect} disabled={false} />);
    expect(screen.getByPlaceholderText('Declare your action...')).toBeInTheDocument();
  });

  it('passes disabled prop to child components', () => {
    render(<ActionPanel choices={mockChoices} onChoiceSelect={mockOnChoiceSelect} disabled={true} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
    expect(screen.getByPlaceholderText('Waiting for narrator...')).toBeDisabled();
  });

  it('calls onChoiceSelect when choice is clicked', () => {
    render(<ActionPanel choices={mockChoices} onChoiceSelect={mockOnChoiceSelect} disabled={false} />);
    fireEvent.click(screen.getByText('Option A'));
    expect(mockOnChoiceSelect).toHaveBeenCalledWith('Option A');
  });

  it('calls onChoiceSelect when custom action is submitted', () => {
    render(<ActionPanel choices={mockChoices} onChoiceSelect={mockOnChoiceSelect} disabled={false} />);
    const input = screen.getByPlaceholderText('Declare your action...');
    fireEvent.change(input, { target: { value: 'Custom action' } });
    fireEvent.submit(input.closest('form')!);
    expect(mockOnChoiceSelect).toHaveBeenCalledWith('Custom action');
  });
});
