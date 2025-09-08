/**
 * Artillery.js Performance Test Processor
 * Custom logic for load testing scenarios
 */

const crypto = require('crypto');

module.exports = {
  // Generate unique test data
  generateTestData: function(context, ee, next) {
    const uuid = crypto.randomUUID();
    context.vars.uuid = uuid;
    context.vars.testEmail = `test+${uuid}@gamegen.test`;
    context.vars.gameTitle = `Load Test Game ${uuid.slice(0, 8)}`;
    
    // Set random user preferences for realistic testing
    context.vars.gameType = ['platformer', 'puzzle', 'rpg', 'strategy'][
      Math.floor(Math.random() * 4)
    ];
    context.vars.complexity = ['simple', 'medium', 'complex'][
      Math.floor(Math.random() * 3)
    ];
    
    return next();
  },

  // Track LLM API performance metrics
  trackLLMMetrics: function(context, ee, next) {
    if (context.vars.tokens_used) {
      const tokensPerSecond = context.vars.tokens_used / (context.vars.response_time / 1000);
      
      // Emit custom metrics
      ee.emit('histogram', 'tokens_generated', context.vars.tokens_used);
      ee.emit('histogram', 'tokens_per_second', tokensPerSecond);
      
      // Track token efficiency by game type
      ee.emit('counter', `tokens_${context.vars.gameType}`, context.vars.tokens_used);
    }
    
    return next();
  },

  // Validate response structure for game creation
  validateGameResponse: function(context, ee, next) {
    const body = context.vars.$;
    
    if (!body || !body.id) {
      ee.emit('counter', 'validation_failures.game_creation', 1);
      return next(new Error('Invalid game creation response'));
    }
    
    // Validate expected game properties
    const requiredProps = ['id', 'title', 'type', 'created_at'];
    const missingProps = requiredProps.filter(prop => !body[prop]);
    
    if (missingProps.length > 0) {
      ee.emit('counter', 'validation_failures.missing_properties', 1);
      console.warn(`Missing game properties: ${missingProps.join(', ')}`);
    }
    
    return next();
  },

  // Track authentication performance
  trackAuthPerformance: function(context, ee, next) {
    const responseTime = context.vars.response_time;
    
    if (responseTime) {
      ee.emit('histogram', 'auth_response_time', responseTime);
      
      // Track auth method performance
      if (context.vars.authMethod) {
        ee.emit('histogram', `auth_${context.vars.authMethod}_time`, responseTime);
      }
    }
    
    return next();
  },

  // Monitor export queue performance
  trackExportPerformance: function(context, ee, next) {
    const exportStatus = context.vars.exportStatus;
    
    if (exportStatus) {
      ee.emit('counter', `export_status_${exportStatus}`, 1);
      
      // Track time to completion for successful exports
      if (exportStatus === 'completed' && context.vars.export_duration) {
        ee.emit('histogram', 'export_completion_time', context.vars.export_duration);
      }
    }
    
    return next();
  },

  // Custom error handler
  handleError: function(context, ee, next) {
    const error = context.vars.$error;
    
    if (error) {
      const errorType = error.code || error.statusCode || 'unknown';
      ee.emit('counter', `errors_${errorType}`, 1);
      
      // Track specific API endpoint errors
      if (context.vars.endpoint) {
        ee.emit('counter', `errors_${context.vars.endpoint}_${errorType}`, 1);
      }
      
      // Log critical errors
      if (errorType >= 500) {
        console.error(`Critical error on ${context.vars.endpoint}:`, error);
      }
    }
    
    return next();
  },

  // Performance baseline checker
  checkPerformanceBaseline: function(context, ee, next) {
    const responseTime = context.vars.response_time;
    const endpoint = context.vars.endpoint;
    
    // Define performance baselines (in ms)
    const baselines = {
      '/': 1000,
      '/auth': 800,
      '/game-creator': 1500,
      '/api/llm/generate': 5000,
      '/api/games': 2000,
    };
    
    const baseline = baselines[endpoint];
    if (baseline && responseTime > baseline) {
      ee.emit('counter', 'performance_baseline_exceeded', 1);
      ee.emit('counter', `slow_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`, 1);
    }
    
    return next();
  },

  // Memory and resource monitoring
  trackResourceUsage: function(context, ee, next) {
    const memoryUsage = process.memoryUsage();
    
    // Emit memory metrics periodically
    if (Math.random() < 0.1) { // 10% of requests
      ee.emit('histogram', 'memory_heap_used', memoryUsage.heapUsed);
      ee.emit('histogram', 'memory_heap_total', memoryUsage.heapTotal);
      ee.emit('histogram', 'memory_external', memoryUsage.external);
    }
    
    return next();
  },

  // Concurrent user simulation
  simulateUserBehavior: function(context, ee, next) {
    // Simulate realistic user think time based on action type
    const actionType = context.vars.actionType;
    const thinkTimes = {
      'page_load': 2000,
      'form_fill': 5000,
      'game_create': 10000,
      'llm_generate': 3000,
      'navigation': 1000,
    };
    
    const thinkTime = thinkTimes[actionType] || 2000;
    context.vars.think_time = thinkTime + Math.random() * 1000; // Add randomness
    
    return next();
  },

  // Data cleanup for long-running tests
  cleanupTestData: function(context, ee, next) {
    // Mark test data for cleanup
    if (context.vars.gameId) {
      ee.emit('counter', 'test_games_created', 1);
      
      // In a real scenario, you might queue this for cleanup
      console.log(`Test game created: ${context.vars.gameId}`);
    }
    
    return next();
  },

  // Final performance summary
  reportPerformanceSummary: function(context, ee, next) {
    if (Math.random() < 0.01) { // 1% of requests for periodic reporting
      const timestamp = new Date().toISOString();
      console.log(`Performance checkpoint at ${timestamp}`);
      
      // This could integrate with monitoring systems
      ee.emit('counter', 'performance_checkpoints', 1);
    }
    
    return next();
  }
};