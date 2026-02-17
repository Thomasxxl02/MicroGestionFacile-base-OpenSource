/**
 * Utility to safely handle async operations in event handlers
 * Prevents unhandled promise rejections and satisfies TypeScript strict rules
 */

export const asyncHandler = <T extends any[]>(
  fn: (...args: T) => Promise<void>
): ((...args: T) => void) => {
  return (...args: T) => {
    void fn(...args);
  };
};

export const createAsyncHandler = <T extends any[]>(
  fn: (...args: T) => Promise<void>
): ((...args: T) => void) => {
  return (...args: T) => {
    fn(...args).catch((error) => {
      console.error('Async handler error:', error);
    });
  };
};

/**
 * Safely execute an async function and ignore the promise
 */
export const safeAsync = <T>(promise: Promise<T>): void => {
  void promise.catch((error) => {
    console.error('Unhandled async error:', error);
  });
};
