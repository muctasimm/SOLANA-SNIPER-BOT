
> Goddess:
https://www.anza.xyz/

> Goddess:
require('dotenv').config();
const { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } = require("@solana/web3.js");
const axios = require("axios");
const bs58 = require("bs58");
const TelegramBot = require("node-telegram-bot-api");

// Load environment variables
const RPC_URL = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
const PRIVATE_KEY = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SLIPPAGE = parseFloat(process.env.SLIPPAGE) || 3;
const TOTAL_INVESTMENT = 20; // Total $20 divided among different trades
const MIN_LIQUIDITY = 5000; // Minimum liquidity to consider a token
const SAFE_VOLUME = 10000; // Minimum volume to ensure safe trading
const MAX_TRADES = 5; // Maximum number of trades to split investment

const connection = new Connection(RPC_URL, "confirmed");
const wallet = PRIVATE_KEY;
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

console.log("🚀 Sniper Bot Started! Wallet:", wallet.publicKey.toString());

async function fetchSafeTokens() {
    try {
        const response = await axios.get("https://api.dexscreener.com/latest/dex/pairs/solana");
        if (!response.data || !Array.isArray(response.data.pairs)) {
            console.error("Invalid API response");
            return [];
        }
        return response.data.pairs.filter(pair => pair.liquidity > MIN_LIQUIDITY && pair.volume24h > SAFE_VOLUME && !pair.scam);
    } catch (error) {
        console.error("Error fetching tokens:", error);
        return [];
    }
}

async function buyToken(tokenAddress, amount) {
    try {
        console.log(`⚡ Buying Safe Token: ${tokenAddress} with $${amount}`);
        
        const tx = new Transaction();
        tx.add(/* Add buy transaction details */);
        await sendAndConfirmTransaction(connection, tx, [wallet]);
        
        console.log(`✅ Successfully Bought Token: ${tokenAddress}`);
        bot.sendMessage(TELEGRAM_CHAT_ID, `✅ Bought Safe Token: ${tokenAddress} with $${amount}`);
    } catch (error) {
        console.error("❌ Buy Failed:", error);
        bot.sendMessage(TELEGRAM_CHAT_ID, `❌ Buy Failed: ${error.message}`);
    }
}

async function autoSell(tokenAddress) {
    try {
        console.log(`🔄 Auto-Selling: ${tokenAddress}`);
        
        const tx = new Transaction();
        tx.add(/* Add sell transaction details */);
        await sendAndConfirmTransaction(connection, tx, [wallet]);
        
        console.log(`✅ Sold Token: ${tokenAddress}`);
        bot.sendMessage(TELEGRAM_CHAT_ID, `✅ Sold Token: ${tokenAddress}`);
    } catch (error) {
        console.error("❌ Sell Failed:", error);
        bot.sendMessage(TELEGRAM_CHAT_ID, `❌ Sell Failed: ${error.message}`);
    }
}

async function sniperBot() {
    console.log("🔍 Scanning for safe tokens...");
    const safeTokens = await fetchSafeTokens();
    
    if (safeTokens.length > 0) {
        const numTrades = Math.min(safeTokens.length, MAX_TRADES);
        const investPerToken = TOTAL_INVESTMENT / numTrades;
        
        await Promise.all(safeTokens.slice(0, numTrades).map(async token => {
            await buyToken(token.address, investPerToken);
            setTimeout(() => autoSell(token.address), 1800000); // Auto-sell after 30 min
        }));
    } else {
        console.log("❌ No safe tokens found, skipping trade.");
        bot.sendMessage(TELEGRAM_CHAT_ID, "❌ No safe tokens found, skipping trade.");
    }
}

setInterval(sniperBot, 5000); // Run every 5 seconds
