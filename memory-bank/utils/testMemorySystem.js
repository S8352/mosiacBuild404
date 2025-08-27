/**
 * Memory System Test Script
 * Validates the memory scaffolding system functionality
 */

const { MemoryManager, MemoryBlock } = require('./memoryManager');
const { ContextEngineer } = require('./contextEngineer');
const { SessionInitializer } = require('./sessionInit');

class MemorySystemTester {
  constructor() {
    this.memoryManager = new MemoryManager({
      memoryBankRoot: './memory-bank',
      logger: console
    });
    
    this.contextEngineer = new ContextEngineer({
      memoryManager: this.memoryManager,
      logger: console
    });
    
    this.sessionInitializer = new SessionInitializer({
      memoryManager: this.memoryManager,
      contextEngineer: this.contextEngineer,
      logger: console
    });
  }

  /**
   * Run all memory system tests
   */
  async runAllTests() {
    console.log('🧠 Starting Memory System Tests...\n');

    const testResults = {
      memoryManager: await this.testMemoryManager(),
      contextEngineer: await this.testContextEngineer(),
      sessionInitializer: await this.testSessionInitializer(),
      integration: await this.testIntegration()
    };

    this.printTestResults(testResults);
    return testResults;
  }

  /**
   * Test Memory Manager functionality
   */
  async testMemoryManager() {
    console.log('📝 Testing Memory Manager...');
    
    const results = {
      store: false,
      retrieve: false,
      search: false,
      update: false,
      delete: false
    };

    try {
      // Test store
      const testMemory = new MemoryBlock('session', 'Test memory content', {
        tags: ['test', 'memory'],
        relevanceScore: 0.8
      });
      
      const stored = await this.memoryManager.store(testMemory);
      results.store = !!stored && stored.id === testMemory.id;

      // Test retrieve
      const retrieved = await this.memoryManager.retrieve(testMemory.id);
      results.retrieve = !!retrieved && retrieved.content === testMemory.content;

      // Test search
      const searchResults = await this.memoryManager.search('test memory', {
        limit: 5,
        minRelevanceScore: 0.1
      });
      results.search = searchResults.length > 0;

      // Test update
      const updated = await this.memoryManager.update(testMemory.id, 'Updated test content');
      results.update = updated.content === 'Updated test content';

      // Test delete
      const deleted = await this.memoryManager.delete(testMemory.id);
      results.delete = deleted === true;

      console.log('✅ Memory Manager tests completed');
    } catch (error) {
      console.error('❌ Memory Manager test failed:', error.message);
    }

    return results;
  }

  /**
   * Test Context Engineer functionality
   */
  async testContextEngineer() {
    console.log('🔧 Testing Context Engineer...');
    
    const results = {
      assembleContext: false,
      getCoreMemory: false,
      getRelevantMemory: false,
      optimizeContext: false,
      prioritizeContext: false
    };

    try {
      // Test assemble context
      const context = await this.contextEngineer.assembleContext('test task');
      results.assembleContext = !!context && context.systemPrompt;

      // Test get core memory
      const coreMemory = await this.contextEngineer.getCoreMemory();
      results.getCoreMemory = Array.isArray(coreMemory);

      // Test get relevant memory
      const relevantMemory = await this.contextEngineer.getRelevantMemory('test');
      results.getRelevantMemory = Array.isArray(relevantMemory);

      // Test optimize context
      const optimized = this.contextEngineer.optimizeContextForTokens(context, 1000);
      results.optimizeContext = !!optimized;

      // Test prioritize context
      const prioritized = this.contextEngineer.prioritizeContext(context, 'test task');
      results.prioritizeContext = !!prioritized && prioritized.high;

      console.log('✅ Context Engineer tests completed');
    } catch (error) {
      console.error('❌ Context Engineer test failed:', error.message);
    }

    return results;
  }

  /**
   * Test Session Initializer functionality
   */
  async testSessionInitializer() {
    console.log('🚀 Testing Session Initializer...');
    
    const results = {
      initializeSession: false,
      validateMemorySystem: false,
      getSessionSummary: false
    };

    try {
      // Test initialize session
      const sessionResult = await this.sessionInitializer.initializeSession({
        currentFocus: 'Memory System Testing',
        activeFeatures: ['testing', 'validation'],
        pendingTasks: ['Complete tests', 'Document results']
      });
      results.initializeSession = sessionResult.success;

      // Test validate memory system
      const validation = await this.sessionInitializer.validateMemorySystem();
      results.validateMemorySystem = validation.valid;

      // Test get session summary
      const summary = await this.sessionInitializer.getSessionSummary();
      results.getSessionSummary = !!summary && summary.context;

      console.log('✅ Session Initializer tests completed');
    } catch (error) {
      console.error('❌ Session Initializer test failed:', error.message);
    }

    return results;
  }

  /**
   * Test integration between components
   */
  async testIntegration() {
    console.log('🔗 Testing Integration...');
    
    const results = {
      memoryToContext: false,
      contextToSession: false,
      fullWorkflow: false
    };

    try {
      // Test memory to context integration
      const testMemory = new MemoryBlock('persistent', 'Integration test memory', {
        tags: ['integration', 'test'],
        relevanceScore: 0.9
      });
      
      await this.memoryManager.store(testMemory);
      const context = await this.contextEngineer.assembleContext('integration test');
      results.memoryToContext = context.relevantMemory.length > 0;

      // Test context to session integration
      await this.sessionInitializer.updateSessionContext({
        currentFocus: 'Integration Testing',
        recentChanges: ['Added integration tests']
      });
      const sessionContext = await this.memoryManager.getSessionContext();
      results.contextToSession = !!sessionContext['current-context'];

      // Test full workflow
      const workflowResult = await this.testFullWorkflow();
      results.fullWorkflow = workflowResult;

      console.log('✅ Integration tests completed');
    } catch (error) {
      console.error('❌ Integration test failed:', error.message);
    }

    return results;
  }

  /**
   * Test full workflow from memory creation to context assembly
   */
  async testFullWorkflow() {
    try {
      // 1. Create test memories
      const memories = [
        new MemoryBlock('core', 'Core workflow test memory', { tags: ['workflow', 'core'] }),
        new MemoryBlock('persistent', 'Persistent workflow test memory', { tags: ['workflow', 'persistent'] }),
        new MemoryBlock('session', 'Session workflow test memory', { tags: ['workflow', 'session'] })
      ];

      for (const memory of memories) {
        await this.memoryManager.store(memory);
      }

      // 2. Assemble context
      const context = await this.contextEngineer.assembleContext('workflow test');

      // 3. Update session
      await this.sessionInitializer.updateSessionContext({
        currentFocus: 'Workflow Testing',
        activeFeatures: ['memory', 'context', 'session']
      });

      // 4. Validate results
      const hasCoreMemory = context.coreMemory.length > 0;
      const hasRelevantMemory = context.relevantMemory.length > 0;
      const hasSessionContext = Object.keys(context.sessionContext).length > 0;

      return hasCoreMemory && hasRelevantMemory && hasSessionContext;
    } catch (error) {
      console.error('Workflow test error:', error.message);
      return false;
    }
  }

  /**
   * Print test results
   */
  printTestResults(results) {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');

    let totalTests = 0;
    let passedTests = 0;

    for (const [component, componentResults] of Object.entries(results)) {
      console.log(`\n${component.toUpperCase()}:`);
      
      for (const [test, passed] of Object.entries(componentResults)) {
        totalTests++;
        if (passed) passedTests++;
        
        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
      }
    }

    console.log('\n📈 Overall Results:');
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${passedTests}`);
    console.log(`  Failed: ${totalTests - passedTests}`);
    console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
      console.log('\n🎉 All tests passed! Memory system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the implementation.');
    }
  }

  /**
   * Performance test
   */
  async performanceTest() {
    console.log('\n⚡ Running Performance Test...');
    
    const startTime = Date.now();
    
    try {
      // Create multiple memories
      const memories = [];
      for (let i = 0; i < 100; i++) {
        memories.push(new MemoryBlock('persistent', `Performance test memory ${i}`, {
          tags: ['performance', `test-${i}`],
          relevanceScore: Math.random()
        }));
      }

      // Store memories
      const storeStart = Date.now();
      for (const memory of memories) {
        await this.memoryManager.store(memory);
      }
      const storeTime = Date.now() - storeStart;

      // Search memories
      const searchStart = Date.now();
      const searchResults = await this.contextEngineer.getRelevantMemory('performance test', {
        limit: 20
      });
      const searchTime = Date.now() - searchStart;

      // Assemble context
      const contextStart = Date.now();
      const context = await this.contextEngineer.assembleContext('performance test');
      const contextTime = Date.now() - contextStart;

      const totalTime = Date.now() - startTime;

      console.log('📊 Performance Results:');
      console.log(`  Store 100 memories: ${storeTime}ms`);
      console.log(`  Search memories: ${searchTime}ms`);
      console.log(`  Assemble context: ${contextTime}ms`);
      console.log(`  Total time: ${totalTime}ms`);
      console.log(`  Average per operation: ${(totalTime / 3).toFixed(1)}ms`);

      // Cleanup
      for (const memory of memories) {
        await this.memoryManager.delete(memory.id);
      }

    } catch (error) {
      console.error('❌ Performance test failed:', error.message);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new MemorySystemTester();
  
  tester.runAllTests()
    .then(() => tester.performanceTest())
    .then(() => {
      console.log('\n🏁 All tests completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  MemorySystemTester
};

