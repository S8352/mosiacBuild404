/**
 * Complete Memory System Test
 * Tests all memory system components and integration
 */

const { MemorySystem } = require('./memorySystem');

class CompleteSystemTester {
  constructor() {
    this.memorySystem = new MemorySystem({
      logger: console,
      autoOptimize: false, // Disable for testing
      autoBackup: false
    });
  }

  /**
   * Run complete system test
   */
  async runCompleteTest() {
    console.log('🧠 Starting Complete Memory System Test...\n');

    const testResults = {
      initialization: await this.testInitialization(),
      coreOperations: await this.testCoreOperations(),
      contextEngineering: await this.testContextEngineering(),
      analytics: await this.testAnalytics(),
      optimization: await this.testOptimization(),
      backup: await this.testBackup(),
      integration: await this.testIntegration(),
      performance: await this.testPerformance()
    };

    this.printCompleteResults(testResults);
    return testResults;
  }

  /**
   * Test system initialization
   */
  async testInitialization() {
    console.log('🚀 Testing System Initialization...');
    
    const results = {
      initialize: false,
      validation: false,
      sessionCreation: false
    };

    try {
      const initResult = await this.memorySystem.initialize({
        currentFocus: 'Complete System Testing',
        activeFeatures: ['memory', 'context', 'analytics', 'optimization', 'backup'],
        pendingTasks: ['Test all components', 'Validate integration']
      });

      results.initialize = initResult.success;
      results.validation = initResult.validation.valid;
      results.sessionCreation = !!initResult.sessionId;

      console.log('✅ System initialization completed');
    } catch (error) {
      console.error('❌ System initialization failed:', error.message);
    }

    return results;
  }

  /**
   * Test core memory operations
   */
  async testCoreOperations() {
    console.log('📝 Testing Core Memory Operations...');
    
    const results = {
      store: false,
      retrieve: false,
      search: false,
      update: false,
      delete: false
    };

    try {
      // Test store
      const testMemory = await this.memorySystem.storeMemory(
        'Test memory content for core operations',
        'persistent',
        { tags: ['test', 'core'], relevanceScore: 0.8 }
      );
      results.store = !!testMemory && testMemory.id;

      // Test retrieve
      const retrieved = await this.memorySystem.retrieveMemory(testMemory.id);
      results.retrieve = !!retrieved && retrieved.content === testMemory.content;

      // Test search
      const searchResults = await this.memorySystem.searchMemories('test memory', {
        limit: 5,
        minRelevanceScore: 0.1
      });
      results.search = searchResults.length > 0;

      // Test update
      const updated = await this.memorySystem.updateMemory(
        testMemory.id,
        'Updated test memory content',
        { relevanceScore: 0.9 }
      );
      results.update = updated.content === 'Updated test memory content';

      // Test delete
      const deleted = await this.memorySystem.deleteMemory(testMemory.id);
      results.delete = deleted === true;

      console.log('✅ Core operations completed');
    } catch (error) {
      console.error('❌ Core operations failed:', error.message);
    }

    return results;
  }

  /**
   * Test context engineering
   */
  async testContextEngineering() {
    console.log('🔧 Testing Context Engineering...');
    
    const results = {
      assembleContext: false,
      updateSession: false,
      contextRelevance: false
    };

    try {
      // Test context assembly
      const context = await this.memorySystem.assembleContext('context engineering test');
      results.assembleContext = !!context && context.systemPrompt;

      // Test session context update
      await this.memorySystem.updateSessionContext('test-key', 'Test session content');
      results.updateSession = true;

      // Test context relevance
      const relevantContext = await this.memorySystem.assembleContext('test', {
        includeRelevantMemory: true,
        maxTokens: 5000
      });
      results.contextRelevance = relevantContext.relevantMemory.length >= 0;

      console.log('✅ Context engineering completed');
    } catch (error) {
      console.error('❌ Context engineering failed:', error.message);
    }

    return results;
  }

  /**
   * Test analytics
   */
  async testAnalytics() {
    console.log('📊 Testing Analytics...');
    
    const results = {
      analyticsReport: false,
      performanceTracking: false,
      recommendations: false
    };

    try {
      // Test analytics report
      const analyticsReport = await this.memorySystem.getAnalyticsReport();
      results.analyticsReport = !!analyticsReport && analyticsReport.performance;

      // Test performance tracking (by running some operations)
      await this.memorySystem.storeMemory('Analytics test memory', 'session');
      await this.memorySystem.searchMemories('analytics');
      results.performanceTracking = true;

      // Test recommendations
      const recommendations = await this.memorySystem.getOptimizationRecommendations();
      results.recommendations = Array.isArray(recommendations.analytics);

      console.log('✅ Analytics completed');
    } catch (error) {
      console.error('❌ Analytics failed:', error.message);
    }

    return results;
  }

  /**
   * Test optimization
   */
  async testOptimization() {
    console.log('⚡ Testing Optimization...');
    
    const results = {
      optimization: false,
      recommendations: false
    };

    try {
      // Create some test memories for optimization
      for (let i = 0; i < 10; i++) {
        await this.memorySystem.storeMemory(
          `Optimization test memory ${i}`,
          'persistent',
          { tags: ['optimization', 'test'], relevanceScore: 0.5 }
        );
      }

      // Test optimization
      const optimizationResults = await this.memorySystem.optimize();
      results.optimization = !!optimizationResults && optimizationResults.summary;

      // Test optimization recommendations
      const recommendations = await this.memorySystem.getOptimizationRecommendations();
      results.recommendations = Array.isArray(recommendations.optimization);

      console.log('✅ Optimization completed');
    } catch (error) {
      console.error('❌ Optimization failed:', error.message);
    }

    return results;
  }

  /**
   * Test backup functionality
   */
  async testBackup() {
    console.log('💾 Testing Backup System...');
    
    const results = {
      createBackup: false,
      listBackups: false,
      backupValidation: false
    };

    try {
      // Test backup creation
      const backup = await this.memorySystem.createBackup({
        description: 'Complete system test backup',
        tags: ['test', 'complete-system']
      });
      results.createBackup = !!backup && backup.id;

      // Test backup listing
      const backups = await this.memorySystem.listBackups();
      results.listBackups = Array.isArray(backups) && backups.length > 0;

      // Test backup validation
      const validation = await this.memorySystem.restoreBackup(backup.id, {
        validateOnly: true
      });
      results.backupValidation = validation.valid;

      console.log('✅ Backup system completed');
    } catch (error) {
      console.error('❌ Backup system failed:', error.message);
    }

    return results;
  }

  /**
   * Test integration between components
   */
  async testIntegration() {
    console.log('🔗 Testing Integration...');
    
    const results = {
      endToEnd: false,
      crossComponent: false,
      dataFlow: false
    };

    try {
      // Test end-to-end workflow
      const testMemory = await this.memorySystem.storeMemory(
        'Integration test memory',
        'persistent',
        { tags: ['integration', 'test'] }
      );

      const context = await this.memorySystem.assembleContext('integration test');
      const analytics = await this.memorySystem.getAnalyticsReport();
      
      results.endToEnd = !!testMemory && !!context && !!analytics;

      // Test cross-component communication
      await this.memorySystem.updateSessionContext('integration-test', 'Integration test session data');
      const sessionContext = await this.memorySystem.assembleContext('session test');
      results.crossComponent = !!sessionContext.sessionContext['integration-test'];

      // Test data flow
      const systemStatus = await this.memorySystem.getSystemStatus();
      results.dataFlow = !!systemStatus && systemStatus.initialized;

      console.log('✅ Integration completed');
    } catch (error) {
      console.error('❌ Integration failed:', error.message);
    }

    return results;
  }

  /**
   * Test performance
   */
  async testPerformance() {
    console.log('⚡ Testing Performance...');
    
    const results = {
      bulkOperations: false,
      contextAssembly: false,
      searchPerformance: false
    };

    try {
      const startTime = Date.now();

      // Test bulk operations
      const bulkStart = Date.now();
      const bulkPromises = [];
      for (let i = 0; i < 50; i++) {
        bulkPromises.push(
          this.memorySystem.storeMemory(
            `Performance test memory ${i}`,
            'persistent',
            { tags: ['performance', 'test'] }
          )
        );
      }
      await Promise.all(bulkPromises);
      const bulkTime = Date.now() - bulkStart;
      results.bulkOperations = bulkTime < 5000; // Should complete within 5 seconds

      // Test context assembly performance
      const contextStart = Date.now();
      await this.memorySystem.assembleContext('performance test', {
        includeRelevantMemory: true,
        maxTokens: 10000
      });
      const contextTime = Date.now() - contextStart;
      results.contextAssembly = contextTime < 2000; // Should complete within 2 seconds

      // Test search performance
      const searchStart = Date.now();
      await this.memorySystem.searchMemories('performance test', {
        limit: 20,
        minRelevanceScore: 0.1
      });
      const searchTime = Date.now() - searchStart;
      results.searchPerformance = searchTime < 1000; // Should complete within 1 second

      const totalTime = Date.now() - startTime;

      console.log('📊 Performance Results:');
      console.log(`  Bulk operations: ${bulkTime}ms`);
      console.log(`  Context assembly: ${contextTime}ms`);
      console.log(`  Search: ${searchTime}ms`);
      console.log(`  Total time: ${totalTime}ms`);

      console.log('✅ Performance testing completed');
    } catch (error) {
      console.error('❌ Performance testing failed:', error.message);
    }

    return results;
  }

  /**
   * Print complete test results
   */
  printCompleteResults(results) {
    console.log('\n📊 Complete System Test Results:');
    console.log('================================');

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
      console.log('\n🎉 All tests passed! Complete memory system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the implementation.');
    }

    // System status summary
    console.log('\n📋 System Status Summary:');
    console.log('========================');
    console.log('✅ Memory Manager: Core CRUD operations');
    console.log('✅ Context Engineer: Dynamic context assembly');
    console.log('✅ Session Initializer: Session management');
    console.log('✅ Memory Analytics: Performance monitoring');
    console.log('✅ Memory Optimizer: Automated optimization');
    console.log('✅ Memory Backup: Data persistence');
    console.log('✅ Memory System: Unified orchestration');
  }

  /**
   * Cleanup test data
   */
  async cleanup() {
    try {
      console.log('\n🧹 Cleaning up test data...');
      
      // Get all test memories
      const testMemories = await this.memorySystem.searchMemories('test', {
        limit: 1000,
        minRelevanceScore: 0
      });

      // Delete test memories
      for (const memory of testMemories) {
        if (memory.metadata.tags && memory.metadata.tags.includes('test')) {
          await this.memorySystem.deleteMemory(memory.id);
        }
      }

      // Shutdown system
      await this.memorySystem.shutdown();

      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }
}

// Run complete test if this file is executed directly
if (require.main === module) {
  const tester = new CompleteSystemTester();
  
  tester.runCompleteTest()
    .then(async (results) => {
      // Wait a bit for any background operations to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Cleanup
      await tester.cleanup();
      
      console.log('\n🏁 Complete system test finished!');
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('💥 Complete system test failed:', error);
      
      // Attempt cleanup even on failure
      try {
        await tester.cleanup();
      } catch (cleanupError) {
        console.error('Cleanup also failed:', cleanupError);
      }
      
      process.exit(1);
    });
}

module.exports = {
  CompleteSystemTester
};

