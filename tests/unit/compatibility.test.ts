import { describe, it, expect } from 'vitest';
import { extractWeekendTags } from '../../worker/services/compatibility';

describe('extractWeekendTags', () => {
  it('extracts known tags from status text case-insensitively', () => {
    expect(extractWeekendTags('Looking for coffee and a walk.')).toEqual(['Coffee', 'Walk']);
  });

  it('handles multiple tags in status text', () => {
    expect(extractWeekendTags('Coffee, movie, sports, live music, rooftop, dinner, gallery, bookstore, walk')).toEqual([
      'Coffee', 'Movie', 'Sports', 'Live music', 'Rooftop', 'Dinner', 'Gallery', 'Bookstore', 'Walk'
    ]);
  });

  it('returns empty array if no tags match', () => {
    expect(extractWeekendTags('Just staying home and coding all weekend')).toEqual([]);
    expect(extractWeekendTags('')).toEqual([]);
    expect(extractWeekendTags(null)).toEqual([]);
    expect(extractWeekendTags(undefined)).toEqual([]);
  });
});
