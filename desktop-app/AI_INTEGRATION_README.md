# MeetingMind Desktop - AI Integration Guide

## Overview

MeetingMind Desktop now includes full AI integration capabilities, supporting both OpenAI API and local AI models. This transforms the application from a simulation into a real AI-powered meeting assistant.

## AI Provider Options

### 1. OpenAI Integration (Recommended)

**Features:**
- High-quality AI responses using GPT-4, GPT-4 Turbo, or GPT-3.5 Turbo
- Reliable and fast performance
- Advanced reasoning capabilities
- JSON-structured responses for consistent parsing

**Setup:**
1. Get an OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys)
2. Open MeetingMind Desktop
3. Go to File → AI Settings (Ctrl/Cmd + ,)
4. Select "OpenAI" tab
5. Enter your API key
6. Choose your preferred model (GPT-4 recommended)
7. Click "Test Connection" to verify
8. Save settings

**Cost Considerations:**
- GPT-4: ~$0.03 per 1K tokens (input), ~$0.06 per 1K tokens (output)
- GPT-3.5 Turbo: ~$0.001 per 1K tokens (input), ~$0.002 per 1K tokens (output)
- Typical meeting insight: 200-500 tokens per request

### 2. Local AI Models

**Features:**
- Complete privacy - no data leaves your computer
- No ongoing costs after setup
- Works offline
- Supports various open-source models

**Supported Local AI Services:**
- **Ollama** (Recommended): Easy setup, good model selection
- **LM Studio**: User-friendly interface
- **Text Generation WebUI**: Advanced features
- **Custom endpoints**: Any OpenAI-compatible API

**Ollama Setup (Recommended):**
1. Download and install [Ollama](https://ollama.ai)
2. Install a model: `ollama pull llama2` or `ollama pull mistral`
3. Start Ollama service (usually automatic)
4. In MeetingMind: File → AI Settings
5. Select "Local AI" tab
6. Set endpoint to `http://localhost:11434`
7. Enter model name (e.g., "llama2", "mistral")
8. Test connection and save

**Recommended Local Models:**
- **Llama 2 7B**: Good balance of quality and speed
- **Mistral 7B**: Excellent instruction following
- **Code Llama**: Better for technical discussions
- **Llama 2 13B**: Higher quality, requires more resources

## AI Features

### Real-time Meeting Insights
- Analyzes conversation tone and direction
- Identifies opportunities and concerns
- Provides actionable suggestions
- Highlights key discussion points

### Knowledge Search
- AI-powered information lookup
- Contextual business intelligence
- Industry statistics and best practices
- Competitive analysis insights

### Follow-up Email Generation
- Professional email drafting
- Action item extraction
- Next steps identification
- Meeting summary creation

### Context Awareness
- Screen content analysis (when enabled)
- Meeting participant background
- Topic-specific recommendations
- Conversation flow optimization

## Configuration Options

### OpenAI Settings
```json
{
  "provider": "openai",
  "openai": {
    "apiKey": "sk-...",
    "model": "gpt-4",
    "baseURL": "https://api.openai.com/v1",
    "maxTokens": 1000,
    "temperature": 0.7
  }
}
```

### Local AI Settings
```json
{
  "provider": "local",
  "local": {
    "endpoint": "http://localhost:11434",
    "model": "llama2",
    "timeout": 30000
  }
}
```

### Feature Controls
```json
{
  "features": {
    "realTimeInsights": true,
    "knowledgeSearch": true,
    "followUpGeneration": true,
    "contextAwareness": true
  }
}
```

## Usage Examples

### 1. Sales Call Assistance
**Scenario:** Client mentions budget concerns
**AI Insight:** "Budget discussion detected. Consider presenting ROI analysis and phased implementation options."
**Suggested Actions:**
- Ask about specific budget range
- Present cost-benefit analysis
- Offer flexible payment terms

### 2. Technical Interview
**Scenario:** Candidate asks about system architecture
**Knowledge Search:** Returns relevant technical documentation, best practices, and implementation examples
**Follow-up:** Generates technical assessment email with next steps

### 3. Business Meeting
**Scenario:** Discussion about market expansion
**AI Analysis:** Provides market research insights, competitive landscape, and strategic recommendations
**Output:** Professional meeting summary with action items and timeline

## Performance Optimization

### OpenAI Optimization
- Use GPT-3.5 Turbo for faster responses
- Adjust `maxTokens` to control response length
- Lower `temperature` for more consistent outputs
- Monitor API usage in OpenAI dashboard

### Local AI Optimization
- Choose model size based on available RAM
- Use GPU acceleration if available
- Adjust timeout based on model performance
- Consider quantized models for better speed

### System Requirements

**For OpenAI:**
- Stable internet connection
- Valid API key with credits
- Minimal local resources required

**For Local AI:**
- **Minimum:** 8GB RAM, 4GB free disk space
- **Recommended:** 16GB RAM, 8GB free disk space
- **Optimal:** 32GB RAM, GPU with 8GB+ VRAM

## Privacy and Security

### OpenAI Integration
- Data is sent to OpenAI servers for processing
- OpenAI's data usage policies apply
- Consider data sensitivity before enabling
- API keys are stored locally and encrypted

### Local AI
- All processing happens on your computer
- No data leaves your system
- Complete privacy and control
- Suitable for sensitive business discussions

## Troubleshooting

### Common OpenAI Issues
**"Invalid API Key"**
- Verify key is correct and active
- Check OpenAI account has sufficient credits
- Ensure key has proper permissions

**"Rate Limit Exceeded"**
- Reduce request frequency
- Upgrade OpenAI plan if needed
- Implement request queuing

### Common Local AI Issues
**"Connection Failed"**
- Verify Ollama/local service is running
- Check endpoint URL is correct
- Ensure firewall allows local connections

**"Model Not Found"**
- Install model: `ollama pull <model-name>`
- Verify model name spelling
- Check available models: `ollama list`

**"Slow Responses"**
- Use smaller model (7B instead of 13B)
- Enable GPU acceleration
- Increase timeout value

## Advanced Configuration

### Custom Prompts
The AI service uses carefully crafted prompts for each feature. These can be customized by modifying the `ai-service.js` file:

```javascript
buildInsightsPrompt(text, context) {
  return `Your custom prompt template here...`;
}
```

### Multiple Providers
You can switch between providers without losing settings. The application maintains separate configurations for each provider type.

### API Compatibility
The local AI integration supports any OpenAI-compatible API endpoint, making it easy to integrate with various AI services and custom deployments.

## Best Practices

### For Business Use
1. **Start with OpenAI** for reliability and quality
2. **Test thoroughly** before important meetings
3. **Review AI suggestions** before acting on them
4. **Maintain human oversight** for critical decisions

### For Privacy-Sensitive Environments
1. **Use local AI only** for confidential discussions
2. **Disable context awareness** if screen capture is concerning
3. **Regular security audits** of AI configurations
4. **Train team members** on proper usage

### For Development/Testing
1. **Use GPT-3.5 Turbo** for cost-effective testing
2. **Implement rate limiting** to control costs
3. **Log AI interactions** for debugging
4. **Monitor performance metrics** regularly

## Support and Updates

The AI integration is actively maintained and updated. New features include:
- Additional model support
- Enhanced prompt engineering
- Performance optimizations
- Security improvements

For issues or feature requests, please refer to the main project documentation or support channels.

---

**Note:** AI-generated content should always be reviewed by humans before use in professional contexts. The quality and accuracy of AI responses depend on the chosen model and configuration.
