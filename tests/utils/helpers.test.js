'use strict';

const { shuffleArray } = require('../../src/utils/helpers');

describe('Utils - Helper Functions', () => {
  describe('shuffleArray', () => {
    test('should return a new array with the same elements', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original);
      
      // Should be a new array (not mutated)
      expect(shuffled).not.toBe(original);
      
      // Should contain the same elements
      expect(shuffled.sort()).toEqual(original.sort());
    });
    
    test('should maintain the same length', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original);
      expect(shuffled.length).toBe(original.length);
    });
    
    test('should not mutate the original array', () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];
      shuffleArray(original);
      expect(original).toEqual(originalCopy);
    });
    
    test('should handle empty arrays', () => {
      const original = [];
      const shuffled = shuffleArray(original);
      expect(shuffled).toEqual([]);
    });
    
    test('should handle arrays with one element', () => {
      const original = [1];
      const shuffled = shuffleArray(original);
      expect(shuffled).toEqual([1]);
    });
    
    test('should have a chance of changing order for arrays with multiple elements', () => {
      // This is a probabilistic test - very unlikely to fail but technically possible
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      // Run multiple shuffle attempts to minimize the chance of random failure
      let atLeastOneShuffled = false;
      
      for (let i = 0; i < 10; i++) {
        const shuffled = shuffleArray(original);
        
        // Check if any element changed position
        const anyDifferent = shuffled.some((val, idx) => val !== original[idx]);
        
        if (anyDifferent) {
          atLeastOneShuffled = true;
          break;
        }
      }
      
      expect(atLeastOneShuffled).toBe(true);
    });
  });
});