import { DIContainer } from './DIContainer';
import { AuthService } from '@/features/auth/services/AuthService';
import { InventoryService } from '@/features/pdr-engine/services/InventoryService';

/**
 * Bootstraps the Dependency Injection Container.
 * This should be called exactly once during the application initialization phase.
 */
export function setupDependencyInjection() {
  // Register Core Services (Singletons)
  DIContainer.register<AuthService>('AuthService', new AuthService());
  DIContainer.register<InventoryService>('InventoryService', new InventoryService());
  
  // Example of factory registration if we needed transient scoping:
  // DIContainer.registerFactory<SomeTransientService>('TransientService', () => new SomeTransientService());
  
  console.log('[DI] Container bootstrapped successfully.');
}
