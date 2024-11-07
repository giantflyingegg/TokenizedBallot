import { viem } from "hardhat";
import { toHex, parseEther } from "viem";

const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];
const MINT_AMOUNT = parseEther("100");

async function main() {
    const publicClient = await viem.getPublicClient();
    const [deployer, acc1, acc2] = await viem.getWalletClients();

    const tokenVotes = await viem.deployContract("MyToken");
    console.log(`MyTokenVotes address: ${tokenVotes.address}`);

    const mintTokens = await tokenVotes.write.mint([deployer.account.address, MINT_AMOUNT]);
    await publicClient.waitForTransactionReceipt({ hash: mintTokens });
    console.log(`Minted ${MINT_AMOUNT.toString()} decimal units to account: ${deployer.account.address}`);

    const balanceDeployer = await tokenVotes.read.balanceOf([deployer.account.address]);
    console.log(`Balance of ${deployer.account.address}: ${balanceDeployer}`);

    const currentBlockNumber = await publicClient.getBlockNumber();
    const targetBlockNumber = currentBlockNumber + 1n;
    console.log("Current block number:", currentBlockNumber);
    console.log("Target block number:", targetBlockNumber);

    const tokenizedBallot = await viem.deployContract("TokenizedBallot", [
        PROPOSALS.map((prop) => toHex(prop, { size: 32 })),
        tokenVotes.address,
        targetBlockNumber,
    ]);
    console.log("tokenizedBallot address: ", tokenizedBallot.address);

    const mintTokens2 = await tokenVotes.write.mint([acc1.account.address, MINT_AMOUNT]);
    await publicClient.waitForTransactionReceipt({ hash: mintTokens2 });
    console.log(`Minted ${MINT_AMOUNT.toString()} decimal units to account: ${acc1.account.address}`);

    // Getting voting power
    console.log("Getting voting power: ");
    const votingPower = await tokenizedBallot.read.getVotePower([deployer.account.address]);
    console.log(`Voting power of ${deployer.account.address}: ${votingPower}`);

    const delegateTx = await tokenVotes.write.delegate([
        acc1.account.address],
        { account: deployer.account }
    );
    await publicClient.waitForTransactionReceipt({ hash: delegateTx });
    console.log(`Delegated voting power to ${deployer.account.address}`);

    // Voting
    console.log("Voting: ");
    const proposalIndex = 0n; // The index of the proposal you want to vote for
    const amountToVote = votingPower / 2n;
    const votingTx = await tokenizedBallot.write.vote(
        [proposalIndex, amountToVote],
        { account: deployer.account }
    );
    await publicClient.waitForTransactionReceipt({ hash: votingTx });
    console.log(`Vote transaction hash: ${votingTx}`);

    const winningProposal = await tokenizedBallot.read.winningProposal();
    console.log(`Winning proposal: ${winningProposal}`);

    const winner = await tokenizedBallot.read.winnerName();
    console.log(`Winner: ${winner}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
