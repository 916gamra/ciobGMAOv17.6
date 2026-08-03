import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../services/AuthService';

const mockGetAll = vi.fn();
const mockCreate = vi.fn();
const mockGetById = vi.fn();

vi.mock('@/core/repositories/GenericRepository', () => {
  return {
    GenericRepository: class {
      getAll = mockGetAll;
      create = mockCreate;
      getById = mockGetById;
    }
  };
});

vi.mock('@/core/config/authSlots', () => ({
  ALL_HARDCODED_SLOTS: [
    { id: 'usr-1', pin: 'hashed_pin', name: 'John', color: '#000', role: 'Operator' }
  ]
}));

vi.mock('@/core/db', () => ({
  db: {
    userOverrides: {}
  }
}));

// Mock security module instead of bcryptjs
vi.mock('@/core/security', () => ({
  hashPin: vi.fn().mockResolvedValue('hashed_pin'),
  verifyPin: vi.fn((plain, hashed) => Promise.resolve(plain === '1234' && hashed === 'hashed_pin'))
}));

import { success } from '@/core/types/Result';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService();
  });

  describe('authenticate', () => {
    it('should authenticate a valid user', async () => {
      mockGetById.mockResolvedValue(success(undefined)); // No override

      const result = await service.authenticate('usr-1', '1234');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('usr-1');
      }
    });

    it('should reject invalid pin', async () => {
      mockGetById.mockResolvedValue(success(undefined));

      const result = await service.authenticate('usr-1', '9999');
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Invalid PIN');
      }
    });

    it('should reject unknown id', async () => {
      const result = await service.authenticate('usr-9999', '1234');
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('User not found');
      }
    });
  });

  describe('registerUser', () => {
    it('should register a new user with hashed pin', async () => {
      mockGetById.mockResolvedValue(success(undefined)); // User does not exist
      mockCreate.mockResolvedValue(success('usr-123'));

      const result = await service.registerUser({
        pin: '4321',
        name: 'Jane',
        color: '#FFF'
      }, 'usr-123');

      expect(result.ok).toBe(true);
      expect(mockCreate).toHaveBeenCalled();
      
      // Verify the saved data has the mocked hashed pin
      const createCallArgs = mockCreate.mock.calls[0][0];
      expect(createCallArgs.pin).toBe('hashed_pin');
      expect(createCallArgs.id).toBe('usr-123');
    });

    it('should reject duplicate id', async () => {
      mockGetById.mockResolvedValue(success({ id: 'usr-123', pin: 'hash', name: 'Jane', color: '#FFF' }));

      const result = await service.registerUser({
        pin: '4321',
        name: 'Jane Two',
        color: '#FFF'
      }, 'usr-123');

      expect(result.ok).toBe(false);
      expect(mockCreate).not.toHaveBeenCalled();
      if (!result.ok) {
        expect(result.error.message).toBe('User with this ID already exists');
      }
    });
  });
});
