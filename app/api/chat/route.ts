import { NextResponse } from 'next/server';
import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import { CdpToolkit } from "@coinbase/cdp-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import fs from 'fs';
import path from 'path';

// Initialize agent and config variables
let agent: any = null;
let config: any = null;

const WALLET_FILE_PATH = path.join(process.cwd(), 'wallet_data.json');

async function initializeAgent() {
  if (agent) return { agent, config };

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
  });

  try {
    // Try to load existing wallet data
    if (!fs.existsSync(WALLET_FILE_PATH)) {
      throw new Error('No wallet data found. Please ensure wallet_data.json exists.');
    }

    const walletData = fs.readFileSync(WALLET_FILE_PATH, 'utf8');
    console.log(walletData);
    const agentConfig = {
      networkId: process.env.NETWORK_ID || "base-sepolia",
      cdpWalletData: walletData.toString(),
    };

    // Initialize CDP AgentKit with existing wallet
    const agentkit = await CdpAgentkit.configureWithWallet(agentConfig);
    console.log('=======',agentConfig);
    // Initialize CDP AgentKit Toolkit and get tools
    const wallet = await agentkit.exportWallet();
    console.log('+++++++',walletData);
    console.log('>>>>>>>',wallet);
    const cdpToolkit = new CdpToolkit(agentkit);
    const tools = cdpToolkit.getTools();

    // Create React Agent using the LLM and CDP AgentKit tools
    agent = createReactAgent({
      llm,
      tools,
      messageModifier: `
        You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. You are 
        empowered to interact onchain using your tools. If you ever need funds, you can request them from the 
        faucet if you are on network ID 'base-sepolia'. If you are on network ID 'base-sepolia', perform actions
        on Base Sepolia network even if the users don't explicit specify the network.
        If not, you can provide your wallet details and request funds from the user. Before executing your first action, 
        get the wallet details to see what network you're on. If there is a 5XX (internal) HTTP error code, ask the user to try again later.
        `,
    });

    config = { configurable: { thread_id: "CDP AgentKit Chatbot Example!" } };

    return { agent, config };
  } catch (error) {
    console.error('Error initializing agent:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { message, isAutonomous } = await request.json();
    
    const { agent, config } = await initializeAgent();
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Failed to initialize agent' }, 
        { status: 500 }
      );
    }
    
    const stream = await agent.stream({ 
      messages: [new HumanMessage(
        isAutonomous 
          ? "You are now in autonomous mode. Please start performing interesting blockchain operations autonomously. Choose actions that demonstrate your capabilities while being safe and responsible."
          : message
      )], 
      config: {
        ...config,
        isAutonomous
      }
    }, config);
    
    let response = '';
    for await (const chunk of stream) {
      if ("agent" in chunk) {
        response += chunk.agent.messages[0].content + '\n';
      } else if ("tools" in chunk) {
        response += chunk.tools.messages[0].content + '\n';
      }
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
} 