import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { GlassCard } from '../GlassCard';

describe('GlassCard Component Unit Tests', () => {
  it('should render children content properly', () => {
    render(
      <GlassCard>
        <div data-testid="test-content">BDR Nexus Card</div>
      </GlassCard>
    );

    const content = screen.getByTestId('test-content');
    expect(content).toBeDefined();
    expect(content.textContent).toBe('BDR Nexus Card');
  });

  it('should apply custom classNames', () => {
    const { container } = render(
      <GlassCard className="custom-test-class">
        <span>Content</span>
      </GlassCard>
    );

    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement.className).toContain('custom-test-class');
  });
});
