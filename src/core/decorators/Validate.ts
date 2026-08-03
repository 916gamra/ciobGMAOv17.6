import { z } from 'zod';
import { ValidationError } from '../errors/AppError';

export function Validate(schema: z.ZodSchema<any>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // We assume the first argument is the payload to validate
      const parsed = schema.safeParse(args[0]);
      
      if (!parsed.success) {
        throw new ValidationError('Validation failed for method arguments', parsed.error.format());
      }
      
      // Pass the fully parsed and typed argument back
      args[0] = parsed.data;
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
