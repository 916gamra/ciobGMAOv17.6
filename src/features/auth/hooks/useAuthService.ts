import { DIContainer } from '@/core/di/DIContainer';
import { AuthService } from '../services/AuthService';

/**
 * React hook to retrieve the AuthService instance from the DI Container.
 * Ensures the UI remains decoupled from concrete instantiations.
 */
export function useAuthService(): AuthService {
  return DIContainer.resolve<AuthService>('AuthService');
}
