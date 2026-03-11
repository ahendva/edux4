// __tests__/components/ui/EmptyState.test.tsx
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TouchableOpacity } from 'react-native';
import EmptyState from '../../../components/ui/EmptyState';

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#1565C0',
      text: '#212121',
      gray: '#9E9E9E',
    },
  }),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

function collectTexts(node: renderer.ReactTestInstance | string | null): string[] {
  if (!node) return [];
  if (typeof node === 'string') return [node];
  const result: string[] = [];
  (node.children ?? []).forEach((child) => {
    result.push(...collectTexts(child as renderer.ReactTestInstance | string));
  });
  return result;
}

describe('EmptyState', () => {
  it('renders title', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => { tree = renderer.create(<EmptyState icon="school-outline" title="No classrooms yet" />); });
    expect(collectTexts(tree.root)).toContain('No classrooms yet');
  });

  it('renders subtitle when provided', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <EmptyState icon="school-outline" title="No classrooms yet" subtitle="Ask a teacher to add you" />,
      );
    });
    expect(collectTexts(tree.root)).toContain('Ask a teacher to add you');
  });

  it('does not render subtitle when omitted', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => { tree = renderer.create(<EmptyState icon="school-outline" title="No classrooms yet" />); });
    expect(collectTexts(tree.root)).not.toContain('Ask a teacher to add you');
  });

  it('renders action button when both actionLabel and onAction provided', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <EmptyState icon="school-outline" title="Title" actionLabel="Create Classroom" onAction={jest.fn()} />,
      );
    });
    expect(collectTexts(tree.root)).toContain('Create Classroom');
  });

  it('does not render action button when actionLabel is missing', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<EmptyState icon="school-outline" title="Title" onAction={jest.fn()} />);
    });
    expect(collectTexts(tree.root)).not.toContain('Create Classroom');
  });

  it('does not render action button when onAction is missing', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<EmptyState icon="school-outline" title="Title" actionLabel="Create Classroom" />);
    });
    expect(collectTexts(tree.root)).not.toContain('Create Classroom');
  });

  it('calls onAction when button is pressed', () => {
    const onAction = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <EmptyState icon="school-outline" title="Title" actionLabel="Go" onAction={onAction} />,
      );
    });
    const pressable = tree.root.findAllByType(TouchableOpacity);
    act(() => { pressable[0].props.onPress(); });
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
