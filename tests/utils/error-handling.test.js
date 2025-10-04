'use strict';

const { createError, asyncHandler } = require('../../src/utils/helpers');

describe('Utils - Error Handling', () => {
  describe('createError', () => {
    test('should create an error with default status code 400', () => {
      const error = createError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
    });

    test('should create an error with specified status code', () => {
      const error = createError('Not found', 404);
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('asyncHandler', () => {
    test('should call the function and return its result', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const handler = asyncHandler(mockFn);
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await handler(req, res, next);
      
      expect(mockFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    test('should call next with the error when function rejects', async () => {
      const error = new Error('Test error');
      const mockFn = jest.fn().mockRejectedValue(error);
      const handler = asyncHandler(mockFn);
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await handler(req, res, next);
      
      expect(mockFn).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});