export class DIContainer {
  private static instances = new Map<string, any>();
  private static factories = new Map<string, () => any>();

  /**
   * Register a singleton instance
   */
  static register<T>(identifier: string, instance: T): void {
    this.instances.set(identifier, instance);
  }

  /**
   * Register a factory function for transient resolution
   */
  static registerFactory<T>(identifier: string, factory: () => T): void {
    this.factories.set(identifier, factory);
  }

  /**
   * Resolve an instance by its identifier
   */
  static resolve<T>(identifier: string): T {
    if (this.instances.has(identifier)) {
      return this.instances.get(identifier) as T;
    }

    if (this.factories.has(identifier)) {
      const factory = this.factories.get(identifier);
      if (factory) {
        return factory() as T;
      }
    }

    throw new Error(`DIContainer: No provider found for identifier [${identifier}]`);
  }

  /**
   * Clear all registrations (useful for testing)
   */
  static clear(): void {
    this.instances.clear();
    this.factories.clear();
  }
}
