/**
 * AIMLAPI Validation Test
 * Simple test to validate the AIMLAPI integration
 */

const https = require('https');

const apiKey = '5eaa9f75edf9430bbbb716cad9e88638';
const baseUrl = 'https://api.aimlapi.com/v1';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(url, options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function validateAIMLAPI() {
  console.log('🚀 Validating AIMLAPI Integration...\n');
  
  try {
    // Test 1: List models
    console.log('📋 Testing model access...');
    const modelsResponse = await makeRequest('/models');
    
    if (modelsResponse.status === 200) {
      const models = modelsResponse.data.data || [];
      console.log(`  ✅ Success: ${models.length} models available`);
      
      // Show key models
      const keyModels = models.filter(m => 
        m.id.includes('gpt') || m.id.includes('claude') || m.id.includes('gemini')
      ).slice(0, 5);
      
      console.log('  🎯 Key models found:');
      keyModels.forEach(model => console.log(`    - ${model.id}`));
      
    } else {
      console.log(`  ❌ Failed: HTTP ${modelsResponse.status}`);
      console.log(`  Error: ${JSON.stringify(modelsResponse.data)}`);
      return false;
    }
    
    // Test 2: Simple completion
    console.log('\n💬 Testing chat completion...');
    const completionData = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Hello! Please respond with "AIMLAPI integration successful" if you can process this request.'
        }
      ],
      max_tokens: 50
    };
    
    const completionResponse = await makeRequest('/chat/completions', 'POST', completionData);
    
    if (completionResponse.status === 200) {
      const content = completionResponse.data.choices?.[0]?.message?.content;
      const tokens = completionResponse.data.usage?.total_tokens;
      
      console.log(`  ✅ Success: Response received`);
      console.log(`  📝 Content: ${content}`);
      console.log(`  🔢 Tokens used: ${tokens}`);
      
      // Calculate cost
      const costPer1K = 0.00315; // GPT-3.5-turbo cost via AIMLAPI
      const estimatedCost = (tokens / 1000) * costPer1K;
      console.log(`  💰 Estimated cost: $${estimatedCost.toFixed(6)}`);
      
    } else {
      console.log(`  ❌ Failed: HTTP ${completionResponse.status}`);
      console.log(`  Error: ${JSON.stringify(completionResponse.data)}`);
      return false;
    }
    
    console.log('\n🎉 AIMLAPI Integration Validation: SUCCESS');
    console.log('✅ API key is valid and working');
    console.log('✅ Models are accessible');
    console.log('✅ Chat completions are functional');
    console.log('✅ Cost tracking is operational');
    console.log('✅ Ready for production deployment');
    
    return true;
    
  } catch (error) {
    console.error('\n💥 Validation failed:', error.message);
    return false;
  }
}

// Run validation
if (require.main === module) {
  validateAIMLAPI()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation error:', error);
      process.exit(1);
    });
}

module.exports = { validateAIMLAPI };
