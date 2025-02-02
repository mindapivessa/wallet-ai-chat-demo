![demovideo](/public/demo.gif)

This is a Wallet AI Chat demo built with [CDP AgentKit](https://github.com/coinbase/agentkit).

## Prerequisites
- Node.js 18+ installed 
- Package manager (npm, yarn, pnpm, or bun)
- CDP API Key 
- OpenAI API Key

## Installation

1. Clone the repository
2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
``` 

3. Set up environment variables by creating a `.env.local` file with the following variables:
```env
OPENAI_API_KEY=your_openai_api_key
CDP_API_KEY_NAME=your_cdp_api_key_name
NETWORK_ID=base-sepolia
NEXT_PUBLIC_AGENT_ADDRESS=your_agent_address
```

## Development

1. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

2. Open http://localhost:3000 with your browser to see the result.

## Important Notes
- Make sure to keep your API keys secure and never commit them to version control
- Ensure all environment variables are properly set before starting the application

## AgentKit

To learn more about AgentKit, take a look at the following resources:

- [AgentKit Documentation](https://docs.cdp.coinbase.com/agentkit/docs/welcome) 


