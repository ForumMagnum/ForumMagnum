/**
 * @jest-environment jsdom
 */
import React, { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  SideItemsContainer,
  SideItemsScope,
  useHasSideItemsSidebar,
} from '../components/contents/SideItems';

jest.mock('../components/hooks/useStyles', () => ({
  defineStyles: () => ({}),
  useStyles: () => ({
    sideItem: 'sideItem',
    sidebar: 'sidebar',
  }),
}));

class MockResizeObserver implements ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}

  disconnect(): void {}
  observe(_target: Element, _options?: ResizeObserverOptions): void {}
  unobserve(_target: Element): void {}
}

globalThis.ResizeObserver = MockResizeObserver;

interface SidebarProbeProps {
  testId: string
  onMount?: () => void
}

const SidebarProbe = ({testId, onMount}: SidebarProbeProps) => {
  const hasSidebar = useHasSideItemsSidebar();

  useEffect(() => {
    onMount?.();
  }, [onMount]);

  return <span data-testid={testId}>{hasSidebar ? 'available' : 'unavailable'}</span>;
};

describe('SideItemsScope', () => {
  it('suppresses side items without remounting its children', () => {
    const onMount = jest.fn();
    const { rerender } = render(
      <SideItemsContainer>
        <SidebarProbe testId="outer" />
        <SideItemsScope enabled={false}>
          <SidebarProbe testId="inner" onMount={onMount} />
        </SideItemsScope>
      </SideItemsContainer>
    );

    expect(screen.getByTestId('outer')).toHaveTextContent('available');
    expect(screen.getByTestId('inner')).toHaveTextContent('unavailable');

    rerender(
      <SideItemsContainer>
        <SidebarProbe testId="outer" />
        <SideItemsScope enabled={true}>
          <SidebarProbe testId="inner" onMount={onMount} />
        </SideItemsScope>
      </SideItemsContainer>
    );

    expect(screen.getByTestId('inner')).toHaveTextContent('available');
    expect(onMount).toHaveBeenCalledTimes(1);
  });
});
