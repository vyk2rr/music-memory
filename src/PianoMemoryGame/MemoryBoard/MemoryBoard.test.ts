import { getChordColor } from './MemoryBoard.utils';

describe('getChordColor D chords', () => {
  test('D major returns basic orange HSL', () => {
    expect(getChordColor('D', 'maj')).toBe('hsl(30, 70%, 50%)');
  });

  test('D minor returns darker orange HSL', () => {
    expect(getChordColor('D', 'min')).toBe('hsl(30, 60%, 35%)');
  });

  test('D diminished returns darkest orange HSL', () => {
    expect(getChordColor('D', 'dim')).toBe('hsl(30, 50%, 25%)');
  });

  test('D augmented returns bright orange HSL', () => {
    expect(getChordColor('D', 'aug')).toBe('hsl(30, 85%, 55%)');
  });

  test('D sus2 returns slightly darker orange HSL', () => {
    expect(getChordColor('D', 'sus2')).toBe('hsl(30, 65%, 40%)');
  });

  test('D sus4 returns saturated orange HSL', () => {
    expect(getChordColor('D', 'sus4')).toBe('hsl(30, 75%, 50%)');
  });

  test('D maj7 returns slightly brighter orange HSL with higher lightness', () => {
    expect(getChordColor('D', 'maj7')).toBe('hsl(30, 72%, 57%)');
  });

  test('D m7 returns darker orange HSL with mid lightness', () => {
    expect(getChordColor('D', 'm7')).toBe('hsl(30, 62%, 42%)');
  });

  test('D dom7 returns saturated orange HSL with elevated lightness', () => {
    expect(getChordColor('D', 'dom7')).toBe('hsl(30, 75%, 52%)');
  });

  // Extended chords (9, 11, 13)
  test('D maj9/11/13 variations return increasingly bright HSLs', () => {
    expect(getChordColor('D', 'maj9')).toBe('hsl(30, 74%, 64%)');
    expect(getChordColor('D', 'maj11')).toBe('hsl(30, 76%, 71%)');
    expect(getChordColor('D', 'maj13')).toBe('hsl(30, 78%, 78%)');
  });

  test('D m9/11/13 variations return darker but progressively lighter HSLs', () => {
    expect(getChordColor('D', 'm9')).toBe('hsl(30, 64%, 49%)');
    expect(getChordColor('D', 'm11')).toBe('hsl(30, 66%, 56%)');
    expect(getChordColor('D', 'm13')).toBe('hsl(30, 68%, 63%)');
  });

  test('D dom9/11/13 variations return saturated and progressively lighter HSLs', () => {
    expect(getChordColor('D', 'dom9')).toBe('hsl(30, 77%, 59%)');
    expect(getChordColor('D', 'dom11')).toBe('hsl(30, 79%, 66%)');
    expect(getChordColor('D', 'dom13')).toBe('hsl(30, 81%, 73%)');
  });
});