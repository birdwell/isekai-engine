import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderMarkdown } from '../markdown';

describe('renderMarkdown', () => {
  it('renders plain text as-is', () => {
    const result = renderMarkdown('Hello world');
    render(<>{result}</>);
    
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders bold text with strong tags', () => {
    const result = renderMarkdown('This is **bold** text');
    render(<>{result}</>);
    
    const boldElement = screen.getByText('bold');
    expect(boldElement.tagName).toBe('STRONG');
    expect(boldElement).toHaveClass('text-amber-400', 'font-bold');
  });

  it('renders italic text with em tags', () => {
    const result = renderMarkdown('This is *italic* text');
    render(<>{result}</>);
    
    const italicElement = screen.getByText('italic');
    expect(italicElement.tagName).toBe('EM');
    expect(italicElement).toHaveClass('text-amber-200', 'italic');
  });

  it('handles multiple bold sections', () => {
    const result = renderMarkdown('**First** and **second** bold');
    render(<>{result}</>);
    
    expect(screen.getByText('First').tagName).toBe('STRONG');
    expect(screen.getByText('second').tagName).toBe('STRONG');
  });

  it('handles multiple italic sections', () => {
    const result = renderMarkdown('*First* and *second* italic');
    render(<>{result}</>);
    
    expect(screen.getByText('First').tagName).toBe('EM');
    expect(screen.getByText('second').tagName).toBe('EM');
  });

  it('handles mixed bold and italic', () => {
    const result = renderMarkdown('**Bold** and *italic* mixed');
    render(<>{result}</>);
    
    expect(screen.getByText('Bold').tagName).toBe('STRONG');
    expect(screen.getByText('italic').tagName).toBe('EM');
  });

  it('returns array of React elements', () => {
    const result = renderMarkdown('**Bold** text');
    
    expect(Array.isArray(result)).toBe(true);
  });

  it('handles empty string', () => {
    const result = renderMarkdown('');
    render(<>{result}</>);
    
    expect(document.body.textContent).toBe('');
  });

  it('handles text with no markdown', () => {
    const result = renderMarkdown('Plain text without formatting');
    render(<>{result}</>);
    
    expect(screen.getByText('Plain text without formatting')).toBeInTheDocument();
    expect(document.querySelector('strong')).toBeNull();
    expect(document.querySelector('em')).toBeNull();
  });

  it('handles adjacent markdown elements', () => {
    const result = renderMarkdown('**bold***italic*');
    render(<>{result}</>);
    
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText('italic').tagName).toBe('EM');
  });
});
