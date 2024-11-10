import { viem } from "hardhat";
import { PublicClient, WalletClient, formatEther, parseEther } from "viem";

// Helper function to convert string to bytes32
function stringToBytes32(str: string): `0x${string}` {
    // Start with empty hex string
    let hex = '0x';
    // Add padding first
    for (let i = 0; i < 64 - str.length * 2; i++) {
        hex += '0';
    }
    // Add actual string
    for (let i = 0; i < str.length; i++) {
        hex += str.charCodeAt(i).toString(16);
    }
    return hex as `0x${string}`;
}

async function main() {
    try {
        console.log("Starting TokenizedBallot deployment and testing...");

        // Get clients
        const publicClient = await viem.getPublicClient();
        const [deployer] = await viem.getWalletClients();
        if (!deployer) throw new Error("No deployer wallet available");

        console.log(`Using deployer account: ${deployer.account.address}`);

        // Deploy BallotToken
        console.log("\nDeploying BallotToken contract...");
        const ballotToken = await viem.deployContract("BallotToken");
        console.log(`BallotToken deployed at ${ballotToken.address}`);

        // Mint tokens
        const mintAmount = parseEther("100");
        console.log(`\nMinting ${formatEther(mintAmount)} tokens to deployer...`);
        const mintTx = await ballotToken.write.mint([deployer.account.address, mintAmount]);
        console.log("Mint transaction hash:", mintTx);
        await publicClient.waitForTransactionReceipt({ hash: mintTx });

        // Self delegate
        console.log("\nSelf-delegating tokens...");
        const delegateTx = await ballotToken.write.delegate([deployer.account.address]);
        console.log("Delegate transaction hash:", delegateTx);
        await publicClient.waitForTransactionReceipt({ hash: delegateTx });

        // Get current block for snapshot
        const currentBlock = await publicClient.getBlockNumber();
        console.log(`\nCurrent block number: ${currentBlock}`);

        // Prepare proposals
        const proposals = ["Proposal A", "Proposal B", "Proposal C"].map(stringToBytes32);
        console.log("\nProposals prepared:", proposals);

        // Deploy TokenizedBallot
        console.log("\nDeploying TokenizedBallot contract...");
        const tokenizedBallot = await viem.deployContract("TokenizedBallot", [
            proposals,
            ballotToken.address,
            currentBlock
        ]);
        console.log(`TokenizedBallot deployed at ${tokenizedBallot.address}`);

        // Check token contract address
        const tokenAddress = await tokenizedBallot.read.tokenContract();
        console.log(`\nToken contract address in ballot: ${tokenAddress}`);

        // Check target block number
        const targetBlock = await tokenizedBallot.read.targetBlockNumber();
        console.log(`Target block number in ballot: ${targetBlock}`);

        // Check voting power
        const votePower = await tokenizedBallot.read.getVotePower([deployer.account.address]);
        console.log(`\nVoting power for deployer: ${formatEther(votePower)}`);

        if (votePower > 0n) {
            // Cast vote
            const proposalId = 0n;
            const voteAmount = votePower / 2n;
            console.log(`\nCasting ${formatEther(voteAmount)} votes for proposal ${proposalId}...`);
            
            const voteTx = await tokenizedBallot.write.vote(
                [proposalId, voteAmount],
                { account: deployer.account }
            );
            console.log("Vote transaction hash:", voteTx);
            await publicClient.waitForTransactionReceipt({ hash: voteTx });

            // Check updated vote count
            const proposal = await tokenizedBallot.read.proposals([proposalId]);
            console.log(`\nProposal ${proposalId} vote count: ${formatEther(proposal[1])}`);
        }

        // Check winning proposal
        const winner = await tokenizedBallot.read.winnerName();
        console.log(`\nWinning proposal: ${winner}`);

        console.log("\nTest completed successfully!");

    } catch (error) {
        console.error("\nError during execution:");
        console.error(error);
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error("\nUnhandled error:");
    console.error(error);
    process.exitCode = 1;
});