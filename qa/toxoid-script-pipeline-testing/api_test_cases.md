# API Test Cases for Toxoid Script Pipeline

## Test Case Suite Overview

### Environment
- Base URL: `http://localhost:3000`
- Content-Type: `application/json`
- Expected Response Format: JSON

---

## 1. Script Generation API Tests

### Endpoint: `POST /api/v1/ai/scripts/generate`

#### Test Case 1.1: Valid Script Generation Request
```bash
curl -X POST http://localhost:3000/api/v1/ai/scripts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a simple player movement system for a platformer game",
    "gameType": "platformer", 
    "complexity": "simple",
    "features": ["player_movement", "collision_detection"],
    "validateGenerated": true,
    "performanceCheck": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "script": "// Generated script content...",
  "metadata": {
    "gameType": "platformer",
    "complexity": "simple", 
    "features": ["player_movement", "collision_detection"],
    "generationTime": 2500,
    "tokensUsed": 150
  },
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": [],
    "metrics": {...}
  }
}
```

#### Test Case 1.2: Invalid Request - Missing Prompt
```bash
curl -X POST http://localhost:3000/api/v1/ai/scripts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "gameType": "platformer",
    "complexity": "simple"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Missing or invalid prompt field",
  "code": "MISSING_PROMPT"
}
```

#### Test Case 1.3: Invalid Game Type
```bash
curl -X POST http://localhost:3000/api/v1/ai/scripts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a movement system",
    "gameType": "invalid_type",
    "complexity": "simple"
  }'
```

**Expected Response:** HTTP 400 with `INVALID_GAME_TYPE` error

#### Test Case 1.4: Prompt Too Short
```bash
curl -X POST http://localhost:3000/api/v1/ai/scripts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Move",
    "gameType": "custom",
    "complexity": "simple"
  }'
```

**Expected Response:** HTTP 400 with `PROMPT_TOO_SHORT` error

#### Test Case 1.5: Get Generation Capabilities
```bash
curl -X GET http://localhost:3000/api/v1/ai/scripts/generate
```

**Expected Response:**
```json
{
  "gameTypes": [...],
  "complexityLevels": [...],
  "availableFeatures": [...],
  "constraints": {...},
  "runtimeInfo": {...}
}
```

---

## 2. Script Validation API Tests  

### Endpoint: `POST /api/v1/ai/scripts/validate`

#### Test Case 2.1: Valid Script Validation
```bash
curl -X POST http://localhost:3000/api/v1/ai/scripts/validate \
  -H "Content-Type: application/json" \
  -d '{
    "script": "const system = Toxoid.System.create(\"TestSystem\", \"Position\", Toxoid.Phases.OnUpdate, (iter) => { console.log(\"Hello\"); });",
    "securityCheck": true,
    "performanceCheck": true,
    "compatibilityCheck": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "result": {
    "isValid": true,
    "errors": [],
    "warnings": [],
    "metrics": {
      "estimatedMemoryUsage": 1024,
      "cyclomaticComplexity": 1,
      "apiUsageCount": {"Toxoid.System.create": 1},
      "performanceScore": 95,
      "securityScore": 100,
      "maintainabilityScore": 90
    },
    "suggestions": [],
    "security": {
      "passed": true,
      "issues": [],
      "riskScore": 5
    }
  },
  "metadata": {
    "validationTime": 150,
    "scriptLength": 125,
    "checksPerformed": ["syntax", "toxoid_api", "security", "compatibility"]
  }
}
```

#### Test Case 2.2: Invalid Script - Syntax Error
```bash
curl -X POST http://localhost:3000/api/v1/ai/scripts/validate \
  -H "Content-Type: application/json" \
  -d '{
    "script": "const system = Toxoid.System.create(\"TestSystem\" \"Position\", Toxoid.Phases.OnUpdate, (iter) => { console.log(\"Hello\"); });"
  }'
```

**Expected Response:** Validation should fail with syntax errors

#### Test Case 2.3: Security Violation - eval() Usage
```bash
curl -X POST http://localhost:3000/api/v1/ai/scripts/validate \
  -H "Content-Type: application/json" \
  -d '{
    "script": "eval(\"console.log(\\\"dangerous\\\")\");"
  }'
```

**Expected Response:** Should fail security check with high risk score

#### Test Case 2.4: Batch Validation
```bash
curl -X PUT http://localhost:3000/api/v1/ai/scripts/validate \
  -H "Content-Type: application/json" \
  -d '{
    "scripts": [
      {
        "id": "script1",
        "script": "console.log(\"Hello World\");"
      },
      {
        "id": "script2", 
        "script": "const pos = Toxoid.API.createEntity();"
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "results": [
    {"index": 0, "id": "script1", "isValid": true, ...},
    {"index": 1, "id": "script2", "isValid": true, ...}
  ],
  "errors": [],
  "metadata": {
    "totalScripts": 2,
    "successCount": 2,
    "errorCount": 0,
    "validationTime": 250
  }
}
```

---

## 3. Script Optimization API Tests

### Endpoint: `POST /api/v1/ai/scripts/optimize`

#### Test Case 3.1: Basic Optimization
```bash
curl -X POST http://localhost:3000/api/v1/ai/scripts/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "script": "// This is a comment\nconst system = Toxoid.System.create(\"MovementSystem\", \"Position, Velocity\", Toxoid.Phases.OnUpdate, (iter) => {\n  // Movement logic\n  iter.each((entity) => {\n    const pos = entity.getComponent(\"Position\");\n    const vel = entity.getComponent(\"Velocity\");\n    pos.x += vel.x * iter.deltaTime;\n    pos.y += vel.y * iter.deltaTime;\n  });\n});",
    "optimizationLevel": "basic",
    "preserveComments": false,
    "targetRuntime": "quickjs"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "result": {
    "originalScript": "// Original script...",
    "optimizedScript": "const system=Toxoid.System.create(\"MovementSystem\",\"Position, Velocity\",Toxoid.Phases.OnUpdate,iter=>{iter.each(entity=>{const pos=entity.getComponent(\"Position\");const vel=entity.getComponent(\"Velocity\");pos.x+=vel.x*iter.deltaTime;pos.y+=vel.y*iter.deltaTime})});",
    "compressionRatio": 1.8,
    "optimizationsApplied": ["Comment removal", "Whitespace optimization", "Variable declaration optimization"],
    "performanceGains": {
      "memoryReduction": 15,
      "sizeReduction": 45,
      "estimatedSpeedImprovement": 10
    }
  },
  "metadata": {
    "optimizationTime": 125,
    "originalSize": 380,
    "optimizedSize": 210,
    "optimizationLevel": "basic",
    "targetRuntime": "quickjs"
  }
}
```

#### Test Case 3.2: Performance Profiling (PUT request)
```bash
curl -X PUT http://localhost:3000/api/v1/ai/scripts/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "script": "const system = Toxoid.System.create(\"TestSystem\", \"Position\", Toxoid.Phases.OnUpdate, (iter) => { for(let i = 0; i < 1000; i++) { console.log(i); } });"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "profile": {
    "memoryUsage": {
      "estimatedHeapSize": 2048,
      "estimatedStackSize": 512,
      "objectCount": 5,
      "stringMemory": 256,
      "arrayMemory": 0
    },
    "executionTime": {
      "estimatedTotalTime": 50,
      "hotPaths": [...],
      "systemCallCounts": {...}
    },
    "apiCallFrequency": {"console.log": 1000},
    "loopComplexity": [...],
    "optimizationOpportunities": [...]
  },
  "metadata": {
    "analysisTime": 75,
    "scriptLength": 150
  }
}
```

#### Test Case 3.3: Optimization Recommendations (PATCH request) 
```bash
curl -X PATCH http://localhost:3000/api/v1/ai/scripts/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "script": "const system = Toxoid.System.create(\"TestSystem\", \"Position\", Toxoid.Phases.OnUpdate, (iter) => { iter.entities().forEach(entity => { console.log(entity); }); });"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "type": "performance",
      "priority": 8,
      "description": "Use traditional for loop instead of forEach for better QuickJS performance",
      "before": "iter.entities().forEach(entity => { ... })",
      "after": "const entities = iter.entities(); for(let i = 0; i < entities.length; i++) { const entity = entities[i]; ... }",
      "estimatedGain": "15-20% performance improvement"
    }
  ],
  "metadata": {
    "analysisTime": 45,
    "scriptLength": 140,
    "recommendationCount": 1
  }
}
```

---

## Error Response Test Cases

### Test Case E1: Invalid JSON
```bash
curl -X POST http://localhost:3000/api/v1/ai/scripts/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test" invalid json}'
```

**Expected:** HTTP 400, `INVALID_JSON` error code

### Test Case E2: Empty Script Validation
```bash
curl -X POST http://localhost:3000/api/v1/ai/scripts/validate \
  -H "Content-Type: application/json" \
  -d '{"script": ""}'
```

**Expected:** HTTP 400, `EMPTY_SCRIPT` error code

### Test Case E3: Script Too Large
```bash
curl -X POST http://localhost:3000/api/v1/ai/scripts/optimize \
  -H "Content-Type: application/json" \
  -d "{\"script\": \"$(printf 'a%.0s' {1..1048577})\"}"
```

**Expected:** HTTP 400, `SCRIPT_TOO_LARGE` error code

## CORS and Options Tests

### Test Case C1: CORS Preflight
```bash
curl -X OPTIONS http://localhost:3000/api/v1/ai/scripts/generate \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

**Expected:** Proper CORS headers in response

---

## Test Execution Checklist

- [ ] All positive test cases pass with expected responses
- [ ] All negative test cases fail with appropriate error codes  
- [ ] Security validation catches malicious patterns
- [ ] Performance profiling returns accurate metrics
- [ ] CORS headers are properly set
- [ ] Response times are acceptable (< 5 seconds)
- [ ] Memory usage stays within limits during testing
- [ ] Error messages are descriptive and actionable

## Performance Benchmarks

| Endpoint | Operation | Target Response Time | Acceptable Range |
|----------|-----------|---------------------|------------------|
| Generate | Simple script | < 3000ms | 1000-5000ms |
| Validate | Basic validation | < 200ms | 100-500ms |
| Validate | Security scan | < 500ms | 200-1000ms |
| Optimize | Basic optimization | < 300ms | 100-800ms |
| Optimize | Performance profile | < 1000ms | 500-2000ms |