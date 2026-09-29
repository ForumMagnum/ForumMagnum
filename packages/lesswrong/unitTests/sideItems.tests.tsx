/**
 * @jest-environment jsdom
 */
import React, { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  SideItem,
  SideItemsContainer,
  SideItemsScope,
  SideItemsSidebar,
  useHasSideItemsSidebar,
} from '../components/contents/SideItems';

jest.mock('../components/hooks/useStyles', () => {
  const classes = {
    sideItem: 'sideItem',
    sidebar: 'sidebar',
  };
  return {
    defineStyles: () => ({}),
    useStyles: () => classes,
  };
});

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

  it('removes registered side items when disabled', () => {
    const { rerender } = render(
      <SideItemsContainer>
        <SideItemsScope enabled={true}>
          <SideItem>
            <span data-testid="scoped-side-item">Sidenote</span>
          </SideItem>
        </SideItemsScope>
        <SideItemsSidebar />
      </SideItemsContainer>
    );

    expect(screen.getByTestId('scoped-side-item')).toBeInTheDocument();

    rerender(
      <SideItemsContainer>
        <SideItemsScope enabled={false}>
          <SideItem>
            <span data-testid="scoped-side-item">Sidenote</span>
          </SideItem>
        </SideItemsScope>
        <SideItemsSidebar />
      </SideItemsContainer>
    );

    expect(screen.queryByTestId('scoped-side-item')).not.toBeInTheDocument();
  });
});
