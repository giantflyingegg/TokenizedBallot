// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

interface IMyToken {
    function getPastVotes(address, uint256) external view returns (uint256);
}

contract TokenizedBallot {
    struct Proposal {
        bytes32 name;
        uint voteCount;
    }

    IMyToken public tokenContract;
    Proposal[] public proposals;
    uint256 public targetBlockNumber;
    mapping (address => uint) public votePowerSpent;

    constructor(bytes32[] memory _proposalNames, address _tokenContract, uint256 _targetBlockNumber) {
        tokenContract = IMyToken(_tokenContract);
        targetBlockNumber = _targetBlockNumber;
        // TODO: Validate if targetBlockNumber is in the past
        for (uint i = 0; i < _proposalNames.length; i++) {
            proposals.push(Proposal({name: _proposalNames[i], voteCount: 0}));
        }
    }

    function vote(uint256 proposal, uint256 amount) external {
        // TODO: Implement vote function
        uint256 votePower = getVotePower(msg.sender); // TODO:
        require(votePower >= amount, "Error: Trying to vote with more votes than available.");
        votePowerSpent[msg.sender] += amount;
        // If `proposal` is out of the range of the array, this will throw automatically and revert all changes.
        proposals[proposal].voteCount += amount;
    }

    function getVotePower(address voter_) public returns (uint256) {
        return tokenContract.getPastVotes(voter_, targetBlockNumber) - votePowerSpent[voter_];
    }

    function winningProposal() public view returns (uint winningProposal_) {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    function winnerName() external view returns (bytes32 winnerName_) {
        winnerName_ = proposals[winningProposal()].name;
    }
}
