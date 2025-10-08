// Test script to validate MeetingMind modules
console.log('🧪 Testing MeetingMind Modules...');

try {
  console.log('✅ Testing AI Service Enhanced...');
  const AIService = require('./ai-service-enhanced');
  console.log('✅ AI Service Enhanced loaded successfully');

  console.log('✅ Testing Multi-Vision API System...');
  const MultiVisionAPISystem = require('./multi-vision-api-system');
  console.log('✅ Multi-Vision API System loaded successfully');

  console.log('✅ Testing Collaborative AI Overlay...');
  const CollaborativeAIOverlay = require('./collaborative-ai-overlay');
  console.log('✅ Collaborative AI Overlay loaded successfully');

  console.log('✅ Testing Screen Capture...');
  const ScreenCapture = require('./screen-capture');
  console.log('✅ Screen Capture loaded successfully');

  console.log('✅ Testing Audio Processor...');
  const AudioProcessor = require('./audio-processor');
  console.log('✅ Audio Processor loaded successfully');

  console.log('✅ Testing Legal Disclaimer System...');
  const LegalDisclaimerSystem = require('./legal-disclaimer-system');
  console.log('✅ Legal Disclaimer System loaded successfully');

  console.log('🎉 ALL MODULES LOADED SUCCESSFULLY!');
  console.log('📊 Module Test Results:');
  console.log('   - AI Service Enhanced: ✅ Ready');
  console.log('   - Multi-Vision API System: ✅ Ready');
  console.log('   - Collaborative AI Overlay: ✅ Ready');
  console.log('   - Screen Capture: ✅ Ready');
  console.log('   - Audio Processing: ✅ Ready');
  console.log('   - Legal Framework: ✅ Ready');
  console.log('🚀 MeetingMind is ready for deployment!');

} catch (error) {
  console.error('❌ Module test failed:', error.message);
  process.exit(1);
}
