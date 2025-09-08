/**
 * Basic Jest setup verification test
 */

describe('Jest Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to Jest functions', () => {
    expect(jest).toBeDefined();
    expect(jest.fn).toBeDefined();
  });

  it('should have environment variables set up', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});