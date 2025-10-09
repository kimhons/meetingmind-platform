# MeetingMind API Key Configuration Guide

## Overview

The MeetingMind platform uses a **Hybrid AI Provider Strategy** that requires API keys from multiple providers to achieve optimal cost savings and reliability. This guide provides step-by-step instructions for obtaining and configuring these API keys.

## Required API Keys

### 1. AIMLAPI (Primary Provider) - **REQUIRED**

AIMLAPI is our primary provider offering 70% cost savings with access to 300+ AI models.

**How to obtain:**
1. Visit [AIMLAPI.com](https://aimlapi.com)
2. Sign up for an account
3. Choose a plan (recommended: Pro plan for production)
4. Navigate to API Keys section
5. Generate a new API key

**Configuration:**
```bash
AIMLAPI_API_KEY=your_aimlapi_key_here
AIMLAPI_BASE_URL=https://api.aimlapi.com/v1
```

**Cost:** Starting at $10/month for 1M tokens

### 2. OpenAI (Backup Provider) - **RECOMMENDED**

OpenAI provides reliable fallback for critical operations and access to GPT-5.

**How to obtain:**
1. Visit [platform.openai.com](https://platform.openai.com)
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new secret key
5. Add billing information and credits

**Configuration:**
```bash
OPENAI_API_KEY=your_openai_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
```

**Cost:** Pay-per-use, approximately $20/1M tokens

### 3. Anthropic (Backup Provider) - **RECOMMENDED**

Anthropic provides Claude models for accuracy validation and safety.

**How to obtain:**
1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign up for an account
3. Navigate to API Keys
4. Generate a new API key
5. Add payment method

**Configuration:**
```bash
ANTHROPIC_API_KEY=your_anthropic_key_here
ANTHROPIC_BASE_URL=https://api.anthropic.com/v1
```

**Cost:** Pay-per-use, approximately $15/1M tokens

### 4. Google AI (Backup Provider) - **OPTIONAL**

Google AI provides Gemini models for speed optimization.

**How to obtain:**
1. Visit [aistudio.google.com](https://aistudio.google.com)
2. Sign in with Google account
3. Navigate to API Keys
4. Create a new API key
5. Enable billing if needed

**Configuration:**
```bash
GOOGLE_API_KEY=your_google_key_here
GOOGLE_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

**Cost:** Free tier available, then pay-per-use

## Configuration Priority

The system is designed to work with different combinations of providers:

### Minimum Configuration (Budget Option)
- **AIMLAPI only**: 70% cost savings, basic functionality
- **Total monthly cost**: ~$10-50 for small to medium usage

### Recommended Configuration (Production)
- **AIMLAPI + OpenAI**: Cost savings with reliable fallback
- **Total monthly cost**: ~$30-100 for production usage

### Enterprise Configuration (Maximum Reliability)
- **All providers**: Maximum reliability and feature coverage
- **Total monthly cost**: ~$50-200 for enterprise usage

## Environment Configuration

### Step 1: Copy Environment Template
```bash
cp .env.example .env
```

### Step 2: Configure API Keys
Edit the `.env` file with your actual API keys:

```bash
# Hybrid AI Provider Configuration
AIMLAPI_API_KEY=sk-aiml-your-actual-key-here
OPENAI_API_KEY=sk-your-actual-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key-here
GOOGLE_API_KEY=your-actual-google-key-here

# AI Strategy Configuration
AI_STRATEGY=hybrid
PRIMARY_PROVIDER=aimlapi
FALLBACK_PROVIDERS=openai,anthropic,google
```

### Step 3: Test Configuration
```bash
npm run test:ai
```

## Provider Health Monitoring

The system automatically monitors provider health and routes requests accordingly:

- **Healthy**: Provider responds within 2 seconds with success
- **Degraded**: Provider responds slowly but successfully
- **Unhealthy**: Provider fails to respond or returns errors

## Cost Optimization Settings

Configure cost targets in your environment:

```bash
# Cost and Performance Targets
TARGET_COST_SAVINGS=70
MAX_LATENCY_MS=2000
MIN_SUCCESS_RATE=95
```

## Security Best Practices

### 1. API Key Security
- Never commit API keys to version control
- Use environment variables only
- Rotate keys regularly (monthly recommended)
- Monitor usage for unusual activity

### 2. Access Control
- Restrict API key permissions where possible
- Use separate keys for development and production
- Implement rate limiting on your endpoints

### 3. Monitoring
- Enable usage tracking: `ENABLE_USAGE_TRACKING=true`
- Monitor costs: `COST_TRACKING=true`
- Set up alerts for unusual usage patterns

## Troubleshooting

### Common Issues

**1. "Provider unhealthy" errors**
- Check API key validity
- Verify network connectivity
- Check provider status pages
- Ensure sufficient credits/quota

**2. High costs**
- Review usage patterns
- Adjust `TARGET_COST_SAVINGS` setting
- Consider using AIMLAPI for more operations
- Implement caching for repeated requests

**3. Slow responses**
- Check `MAX_LATENCY_MS` setting
- Verify provider health
- Consider geographic proximity to providers
- Review network latency

### Testing Commands

```bash
# Test individual providers
npm run test:aimlapi
npm run test:openai
npm run test:anthropic
npm run test:google

# Test hybrid system
npm run test:hybrid

# Test specific features
npm run test:triple-ai
npm run test:coaching
npm run test:interview
```

## Cost Estimation

### Monthly Usage Examples

| Users | Requests/Month | AIMLAPI Cost | Direct Cost | Savings |
|-------|----------------|--------------|-------------|---------|
| 100   | 50K           | $15          | $50         | 70%     |
| 1K    | 500K          | $150         | $500        | 70%     |
| 10K   | 5M            | $1,500       | $5,000      | 70%     |

### Cost Monitoring

The system provides real-time cost tracking:
- Daily usage reports
- Provider cost comparison
- Savings calculations
- Budget alerts

## Support

For API key configuration support:

1. **AIMLAPI**: [support@aimlapi.com](mailto:support@aimlapi.com)
2. **OpenAI**: [help.openai.com](https://help.openai.com)
3. **Anthropic**: [support.anthropic.com](https://support.anthropic.com)
4. **Google AI**: [support.google.com](https://support.google.com)

For MeetingMind platform support:
- Documentation: `/docs/`
- Issues: Check logs in `/logs/`
- Monitoring: Access dashboard at `/admin/monitoring`

## Next Steps

After configuring API keys:

1. **Test the system**: Run `npm run test:hybrid`
2. **Deploy to staging**: Use Railway deployment
3. **Monitor performance**: Check analytics dashboard
4. **Optimize costs**: Review usage patterns and adjust settings
5. **Scale up**: Add more providers as needed

The hybrid AI system is designed to provide maximum flexibility while minimizing costs. Start with AIMLAPI for immediate cost savings, then add backup providers as your usage grows.
