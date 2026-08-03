export type Middleware<T> = (
  context: T,
  next: () => Promise<void>
) => Promise<void>;

export class MiddlewareChain<T> {
  private middlewares: Middleware<T>[] = [];

  use(middleware: Middleware<T>): this {
    this.middlewares.push(middleware);
    return this;
  }

  async execute(context: T): Promise<void> {
    let index = -1;

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) throw new Error('next() called multiple times');
      index = i;
      if (i < this.middlewares.length) {
        await this.middlewares[i](context, dispatch.bind(null, i + 1));
      }
    };

    await dispatch(0);
  }
}
