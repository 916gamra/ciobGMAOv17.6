import { GenericRepository } from '@/core/repositories/GenericRepository';
import { db, UserOverride, User } from '@/core/db';
import { Result, success, failure } from '@/core/types/Result';
import { AppError, UnauthorizedError, NotFoundError } from '@/core/errors/AppError';
import { createLogger } from '@/core/logging/Logger';
import { hashPin, verifyPin } from '@/core/security';
import { ALL_HARDCODED_SLOTS, AuthSlot } from '@/core/config/authSlots';

const logger = createLogger('AuthService');

export class AuthService {
  private repository: GenericRepository<UserOverride>;

  constructor() {
    this.repository = new GenericRepository<UserOverride>(db.userOverrides);
  }

  async getAuthSlot(id: string): Promise<Result<User>> {
    try {
      const slot = ALL_HARDCODED_SLOTS.find(s => s.id === id);
      if (!slot) {
         return failure(new NotFoundError('User'));
      }
      const overrideResult = await this.repository.getById(id);
      if (!overrideResult.ok) return failure(overrideResult.error);
      
      const override = overrideResult.value;
      if (!override) return success(slot as User);
      
      return success({
        ...slot,
        ...override,
      } as User);
    } catch (error) {
      return failure(new AppError('AUTH_ERROR', 'Failed to retrieve auth slot', 500, { error }));
    }
  }

  async authenticate(id: string, pin: string): Promise<Result<User>> {
    try {
      const userResult = await this.getAuthSlot(id);
      if (!userResult.ok) {
        logger.warn('Authentication failed: User not found', { id });
        return failure(new NotFoundError('User'));
      }

      const user = userResult.value;
      
      // Allow simple string match for fallback/development, but prefer bcrypt verification
      const isValid = (user.pin === pin) || (user.pin ? await verifyPin(pin, user.pin) : false);

      if (!isValid) {
        logger.warn('Authentication failed: Invalid PIN', { id });
        return failure(new UnauthorizedError('Invalid PIN'));
      }

      logger.info('User authenticated successfully', { userId: user.id });
      return success(user);
    } catch (error) {
      logger.error('Authentication error', { error, id });
      return failure(new AppError('AUTH_ERROR', 'An error occurred during authentication', 500, { error }));
    }
  }

  async registerUser(userData: Omit<UserOverride, 'id'>, customId?: string): Promise<Result<string>> {
    try {
      const newId = customId || crypto.randomUUID();
      
      const existingUser = await this.repository.getById(newId);
      if (!existingUser.ok) return failure(existingUser.error);
      
      if (existingUser.value) {
        return failure(new AppError('CONFLICT', 'User with this ID already exists', 409));
      }

      const hashedPin = userData.pin ? await hashPin(userData.pin) : undefined;
      
      const userToCreate: UserOverride = {
        ...userData,
        id: newId,
        pin: hashedPin
      };

      const result = await this.repository.create(userToCreate);
      
      if (result.ok) {
        logger.info('User registered successfully', { userId: result.value });
      }
      return result;
    } catch (error) {
       logger.error('Registration error', { error });
       return failure(new AppError('AUTH_ERROR', 'Failed to register user', 500, { error }));
    }
  }
}
