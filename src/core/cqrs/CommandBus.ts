// src/core/cqrs/CommandBus.ts
import { Command } from './Command';
import { Result, ValidationError, AppError } from '@/core/error';
import { createLogger } from '@/core/logging/Logger';
import { AuditService } from '@/core/logging/AuditService';

const logger = createLogger('CommandBus');

export class CommandBus {
  private handlers = new Map<string, (command: any) => Promise<any>>();

  register<T extends Command<any>>(
    commandType: new (...args: any[]) => T,
    handler: (command: T) => Promise<any>
  ): void {
    this.handlers.set(commandType.name, handler);
    logger.debug(`Registered command handler for: ${commandType.name}`);
  }

  async execute<T>(command: Command<T>, userId: string = 'SYSTEM'): Promise<Result<T>> {
    const commandName = command.constructor.name;
    const startTime = performance.now();

    try {
      logger.info(`Executing command: ${commandName}`, { userId });

      // Validate the command schema / inputs
      if (!command.validate()) {
        throw new ValidationError(`Validation failed for command: ${commandName}`);
      }

      // Find the appropriate registered handler
      const handler = this.handlers.get(commandName);
      if (!handler) {
        throw new AppError('COMMAND_HANDLER_NOT_FOUND', `No handler registered for command: ${commandName}`, 500);
      }

      // Execute command logic
      const result = await handler(command);

      const duration = performance.now() - startTime;
      
      // Audit trail
      await AuditService.log(
        'COMMAND_EXECUTED',
        'Command',
        commandName,
        { durationMs: duration.toFixed(2), success: true },
        userId,
        userId === 'SYSTEM' ? 'System' : 'User',
        'INFO'
      );

      logger.info(`Command completed successfully: ${commandName}`, {
        durationMs: duration.toFixed(2),
      });

      return { ok: true, value: result };
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(`Command failed: ${commandName}`, error, {
        durationMs: duration.toFixed(2),
        userId,
      });

      // Rollback
      try {
        await command.rollback();
        logger.info(`Rollback executed successfully for command: ${commandName}`);
      } catch (rollbackError) {
        logger.fatal(`Rollback FAILED for command: ${commandName}`, rollbackError);
      }

      // Handle the error via central error mapping
      if (error instanceof AppError) {
        return { ok: false, error };
      }

      const err = error instanceof Error ? error : new Error(String(error));
      return {
        ok: false,
        error: new AppError(
          'COMMAND_EXECUTION_FAILED',
          err.message || 'Command execution failed',
          500,
          { originalError: err.message, commandName }
        ),
      };
    }
  }
}
