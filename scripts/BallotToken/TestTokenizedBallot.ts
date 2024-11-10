import { viem } from "hardhat";
import { parseEther, formatEther, stringToHex, padHex } from "viem";

// Helper function for formatting
const formatAmount = (amount: bigint | undefined) => {
    if (amount === undefined) return "0";
    return formatEther(amount);
};

// Helper function to convert string to bytes32
const stringToBytes32 = (str: string): `0x${string}` => {
    return padHex(stringToHex(str), { size: 32 });
};

async function main() {
    console.log("Starting TokenizedBallot deployment and testing on Sepolia...");
    
    // Get clients
    const publicClient = await viem.getPublicClient();
    const [deployer] = await viem.getWalletClients();
    console.log(`Using deployer account: ${deployer.account.address}`);
    
    // Check balance
    const balance = await publicClient.getBalance({ address: deployer.account.address });
    console.log(`Deployer balance: ${formatAmount(balance)} ETH`);

    // Use existing token contract
    const BALLOT_TOKEN_ADDRESS = "0x1a8d7dfe105576a153e6779d6389220f296c88d4";
    console.log(`Using existing BallotToken at ${BALLOT_TOKEN_ADDRESS}`);
    
    // Get the latest block number for reference
    const latestBlock = await publicClient.getBlockNumber();
    console.log(`Current block number: ${latestBlock}`);
    
    // Define proposals
    const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"].map(prop => 
        stringToBytes32(prop)
    );
    
    // Deploy TokenizedBallot
    console.log("\nDeploying TokenizedBallot contract...");
    console.log("Proposals:", PROPOSALS);
    
    const tokenizedBallot = await viem.deployContract("TokenizedBallot", [
        PROPOSALS,
        BALLOT_TOKEN_ADDRESS,
        latestBlock
    ]);
    console.log(`TokenizedBallot deployed at ${tokenizedBallot.address}`);
    
    // Wait for deployment confirmation
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check proposals
    console.log("\nChecking proposals:");
    try {
        for (let i = 0; i < PROPOSALS.length; i++) {
            const proposal = await tokenizedBallot.read.proposals([BigInt(i)]);
            console.log(`Proposal ${i}:`);
            if (proposal) {
                console.log(`  Name: ${proposal[0] || "unnamed"}`);
                console.log(`  Vote Count: ${(proposal[1] || 0n).toString()}`);
            }
        }
    } catch (error) {
        console.error("Error reading proposals:", error);
    }
    
    // Check voting power
    try {
        const votePower = await tokenizedBallot.read.getVotePower([deployer.account.address]);
        console.log(`\nVoting power for ${deployer.account.address}: ${votePower ? votePower.toString() : "0"}`);
        
        // Cast a vote if we have voting power
        if (votePower && votePower > 0n) {
            console.log("\nCasting vote...");
            const voteTx = await tokenizedBallot.write.vote(
                [0n, votePower],
                { account: deployer.account }
            );
            console.log(`Vote transaction hash: ${voteTx}`);
            
            // Wait for vote confirmation
            const voteReceipt = await publicClient.waitForTransactionReceipt({ hash: voteTx });
            console.log(`Vote confirmed in block: ${voteReceipt.blockNumber}`);
            
            // Check updated proposal votes
            const updatedProposal = await tokenizedBallot.read.proposals([0n]);
            if (updatedProposal) {
                console.log(`\nUpdated votes for proposal 0: ${updatedProposal[1].toString()}`);
            }
        } else {
            console.log("\nNo voting power available for this account");
        }
    } catch (error) {
        console.error("Error checking voting power or voting:", error);
    }
    
    // Check winning proposal
    try {
        const winningProposal = await tokenizedBallot.read.winnerName();
        console.log(`\nWinning proposal: ${winningProposal}`);
    } catch (error) {
        console.error("Error checking winning proposal:", error);
    }

    console.log("\nTest completed successfully!");
}

main().catch((error) => {
    console.error("\nError during execution:");
    console.error(error);
    process.exitCode = 1;
});