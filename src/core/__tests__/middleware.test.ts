import { describe, it, expect, vi } from 'vitest';
import { MiddlewareChain, Middleware } from '../middleware';

describe('MiddlewareChain', () => {
  it('should execute middlewares in the order they were added', async () => {
    type Context = { executionOrder: string[] };
    const chain = new MiddlewareChain<Context>();
    
    chain.use(async (ctx, next) => {
      ctx.executionOrder.push('first_start');
      await next();
      ctx.executionOrder.push('first_end');
    });

    chain.use(async (ctx, next) => {
      ctx.executionOrder.push('second_start');
      await next();
      ctx.executionOrder.push('second_end');
    });

    const ctx: Context = { executionOrder: [] };
    await chain.execute(ctx);

    expect(ctx.executionOrder).toEqual([
      'first_start',
      'second_start',
      'second_end',
      'first_end'
    ]);
  });

  it('should stop execution if next() is not called', async () => {
    type Context = { count: number };
    const chain = new MiddlewareChain<Context>();

    chain.use(async (ctx, next) => {
      ctx.count += 1;
      // Not calling await next();
    });

    chain.use(async (ctx, next) => {
      ctx.count += 2;
      await next();
    });

    const ctx: Context = { count: 0 };
    await chain.execute(ctx);

    // Only the first middleware should run
    expect(ctx.count).toBe(1);
  });

  it('should throw an error if next() is called multiple times', async () => {
    type Context = {};
    const chain = new MiddlewareChain<Context>();

    chain.use(async (ctx, next) => {
      await next();
      await next(); // Should throw error
    });

    chain.use(async (ctx, next) => {
      await next();
    });

    await expect(chain.execute({})).rejects.toThrow('next() called multiple times');
  });

  it('should pass errors up the chain', async () => {
    const chain = new MiddlewareChain<{}>();

    chain.use(async (ctx, next) => {
      await next();
    });

    chain.use(async (ctx, next) => {
      throw new Error('Test validation error');
    });

    await expect(chain.execute({})).rejects.toThrow('Test validation error');
  });
});
