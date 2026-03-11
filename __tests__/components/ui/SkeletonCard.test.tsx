// __tests__/components/ui/SkeletonCard.test.tsx
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import SkeletonCard, { SkeletonList } from '../../../components/ui/SkeletonCard';

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      surface: '#FFFFFF',
      surfaceSubtle: '#F5F5F5',
    },
  }),
}));

describe('SkeletonCard', () => {
  it('renders without crashing', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => { tree = renderer.create(<SkeletonCard />); });
    expect(tree.toJSON()).not.toBeNull();
  });

  it('renders with hasIcon=false', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => { tree = renderer.create(<SkeletonCard hasIcon={false} />); });
    expect(tree.toJSON()).not.toBeNull();
  });

  it('renders with custom line count', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => { tree = renderer.create(<SkeletonCard lines={4} />); });
    expect(tree.toJSON()).not.toBeNull();
  });
});

describe('SkeletonList', () => {
  it('renders without crashing', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => { tree = renderer.create(<SkeletonList count={3} />); });
    expect(tree.toJSON()).not.toBeNull();
  });

  it('renders the specified number of SkeletonCards', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => { tree = renderer.create(<SkeletonList count={4} />); });
    const cards = tree.root.findAllByType(SkeletonCard);
    expect(cards).toHaveLength(4);
  });
});
