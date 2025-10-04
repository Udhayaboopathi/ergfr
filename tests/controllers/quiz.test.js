'use strict';

const mongoose = require('mongoose');
const { Quiz, Session, Answer } = require('../../src/models');
const { updateRanking } = require('../../src/controllers/quiz.controller');

// Mock dependencies
jest.mock('../../src/models', () => ({
  Quiz: {
    findById: jest.fn()
  },
  Session: {
    find: jest.fn()
  },
  Answer: {
    find: jest.fn()
  }
}));

jest.mock('../../src/services/socket.service', () => ({
  emitToAdmins: jest.fn()
}));

describe('Quiz Controller - Ranking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should sort rankings by score (desc), time (asc), and fullscreen exits (asc)', async () => {
    // Setup mock data
    const mockQuizId = new mongoose.Types.ObjectId();
    const mockUserA = { _id: 'user1', name: 'User A', teamName: 'Team A', email: 'userA@example.com' };
    const mockUserB = { _id: 'user2', name: 'User B', teamName: 'Team B', email: 'userB@example.com' };
    const mockUserC = { _id: 'user3', name: 'User C', teamName: 'Team C', email: 'userC@example.com' };
    
    const sessions = [
      { 
        _id: 'session1', 
        userId: mockUserA, 
        score: 10, 
        totalTimeMs: 5000, 
        fullscreenExits: 0,
        status: 'ended'
      },
      { 
        _id: 'session2', 
        userId: mockUserB, 
        score: 10, 
        totalTimeMs: 4000, 
        fullscreenExits: 2,
        status: 'ended'
      },
      { 
        _id: 'session3', 
        userId: mockUserC, 
        score: 8, 
        totalTimeMs: 3000, 
        fullscreenExits: 0,
        status: 'ended'
      }
    ];
    
    // Setup mocks
    Quiz.findById.mockResolvedValue({ _id: mockQuizId });
    Session.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(sessions)
    });
    
    // Import the function to test after mocking
    const quizController = require('../../src/controllers/quiz.controller');
    
    // Run the function under test
    const req = { params: { quizId: mockQuizId.toString() } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    await quizController.getRanking(req, res);
    
    // Assertions
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    
    const responseData = res.json.mock.calls[0][0];
    expect(responseData.success).toBe(true);
    
    // Check ranking order - should be session2, session1, session3
    const ranking = responseData.ranking;
    
    // Session 2 and 1 have the same score, but session2 has less time
    expect(ranking[0].sessionId).toBe('session2');
    expect(ranking[1].sessionId).toBe('session1');
    
    // Session 3 has lower score
    expect(ranking[2].sessionId).toBe('session3');
  });
});