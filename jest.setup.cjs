require('@testing-library/jest-dom')

// Make jest available globally (fixes 'jest is not defined' errors)
// Create a proper jest mock object with all necessary methods including matchers

// Simple implementation of expect.any for our mock
function expectAny(constructor) {
  return { asymmetricMatch: (actual) => actual instanceof constructor || typeof actual === constructor.name.toLowerCase() };
}

function createMockFunction(mockName = 'mockFunction') {
  const mockFn = function(...args) {
    mockFn.mock.calls.push(args);
    if (mockFn.mock.implementation) {
      return mockFn.mock.implementation.apply(this, args);
    }
    return mockFn.mock.returnValue;
  };
  
  mockFn.mock = {
    calls: [],
    instances: [],
    contexts: [],
    results: [],
    returnValue: undefined,
    implementation: undefined,
    lastCall: undefined,
  };
  
  // Mark as a Jest mock for the Jest expectation system
  mockFn._isMockFunction = true;
  mockFn.getMockImplementation = () => mockFn.mock.implementation;
  mockFn.getMockName = () => mockName;
  
  mockFn.mockImplementation = (impl) => {
    mockFn.mock.implementation = impl;
    return mockFn;
  };
  
  mockFn.mockReturnValue = (value) => {
    mockFn.mock.returnValue = value;
    return mockFn;
  };
  
  mockFn.mockResolvedValue = (value) => {
    mockFn.mock.returnValue = Promise.resolve(value);
    return mockFn;
  };
  
  mockFn.mockRejectedValue = (value) => {
    mockFn.mock.returnValue = Promise.reject(value);
    return mockFn;
  };
  
  mockFn.mockClear = () => {
    mockFn.mock.calls = [];
    mockFn.mock.instances = [];
    mockFn.mock.contexts = [];
    mockFn.mock.results = [];
    return mockFn;
  };
  
  mockFn.mockRestore = () => {
    // Default implementation for restore
    return mockFn;
  };
  
  return mockFn;
}

global.jest = {
  fn: createMockFunction,
  spyOn: (object, method) => {
    const original = object[method];
    const spy = createMockFunction();
    
    // Mark as a Jest mock for the Jest expectation system
    spy._isMockFunction = true;
    spy.getMockImplementation = () => spy.mock.implementation;
    spy.getMockName = () => method || 'mockConstructor';
    
    spy.mockRestore = () => {
      object[method] = original;
    };
    
    // Replace the original method with our spy
    object[method] = function(...args) {
      spy.mock.calls.push(args);
      if (spy.mock.implementation) {
        return spy.mock.implementation.apply(this, args);
      }
      // Call the original method if no implementation is set
      if (original && typeof original === 'function') {
        return original.apply(this, args);
      }
      return spy.mock.returnValue;
    };
    
    return spy;
  },
  mock: (moduleName, factory) => {
    // Simple mock implementation - store mocks for basic module replacement
    if (!global.__jestMocks) {
      global.__jestMocks = {};
    }
    
    if (typeof factory === 'function') {
      global.__jestMocks[moduleName] = factory();
    } else if (factory) {
      global.__jestMocks[moduleName] = factory;
    } else {
      global.__jestMocks[moduleName] = createMockFunction(moduleName);
    }
    
    // For known problematic modules, provide specific implementations
    if (moduleName === 'p-retry') {
      global.__jestMocks[moduleName] = createMockFunction('pRetry').mockImplementation((fn) => {
        // Just execute the function once without retry logic
        return fn();
      });
    }
  },
  clearAllMocks: () => {},
  resetAllMocks: () => {},
  restoreAllMocks: () => {},
};

// Make expect.any available
global.expect = global.expect || {};
global.expect.any = expectAny;

// Add TextEncoder and TextDecoder for MSW and other libraries
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Add BroadcastChannel for MSW v2
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name;
  }
  
  postMessage(data) {
    // Mock implementation - no-op for testing
  }
  
  close() {
    // Mock implementation - no-op for testing
  }
  
  addEventListener() {
    // Mock implementation - no-op for testing
  }
  
  removeEventListener() {
    // Mock implementation - no-op for testing
  }
};

// Add TransformStream for MSW v2
global.TransformStream = class TransformStream {
  constructor() {
    this.readable = new ReadableStream();
    this.writable = new WritableStream();
  }
};

// Add ReadableStream for MSW v2
if (!global.ReadableStream) {
  global.ReadableStream = class ReadableStream {
    constructor() {}
    getReader() {
      return {
        read: () => Promise.resolve({ done: true, value: undefined }),
        releaseLock: () => {},
      };
    }
  };
}

// Add WritableStream for MSW v2
if (!global.WritableStream) {
  global.WritableStream = class WritableStream {
    constructor() {}
    getWriter() {
      return {
        write: () => Promise.resolve(),
        close: () => Promise.resolve(),
        releaseLock: () => {},
      };
    }
  };
}

// Mock Request for Next.js API tests
global.Request = class Request {
  constructor(url, init = {}) {
    // Use defineProperty to handle readonly properties properly
    Object.defineProperty(this, 'url', {
      value: url,
      writable: false,
      enumerable: true
    });
    
    Object.defineProperty(this, 'method', {
      value: init?.method || 'GET',
      writable: false,
      enumerable: true
    });
    
    this.headers = new Map(Object.entries(init?.headers || {}));
    this.body = init?.body;
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body || '{}'));
  }
}

// Mock Response for Next.js API tests
global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Map(Object.entries(init?.headers || {}));
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body));
  }
  
  static json(data, init) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props) {
    return props; // Return props as-is for testing
  },
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      eq: jest.fn(),
      single: jest.fn(),
    })),
  })),
}))

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// Mock fetch
global.fetch = jest.fn()

// Console error suppression for cleaner test output
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: `ReactDOMTestUtils.act` is deprecated'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  // Only log in test environment, don't crash
  if (process.env.NODE_ENV === 'test') {
    console.warn('Unhandled promise rejection in test:', reason);
    // Don't throw or exit, just log
  }
})