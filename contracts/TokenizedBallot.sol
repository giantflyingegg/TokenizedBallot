// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
    mapping(address => uint256) public votePowerSpent;

    constructor(bytes32[] memory _proposalNames, address _tokenContract, uint256 _targetBlockNumber) {
        require(_targetBlockNumber > 0, "Target block number must be positive");
        require(_proposalNames.length > 0, "No proposals provided");
        require(_tokenContract != address(0), "Token contract address cannot be zero");
        
        tokenContract = IMyToken(_tokenContract);
        targetBlockNumber = _targetBlockNumber;
        
        for (uint i = 0; i < _proposalNames.length; i++) {
            proposals.push(Proposal({
                name: _proposalNames[i],
                voteCount: 0
            }));
        }
    }

    function vote(uint256 proposal, uint256 amount) external {
        require(proposal < proposals.length, "Invalid proposal index");
        uint256 votePower = getVotePower(msg.sender);
        require(votePower >= amount, "Insufficient vote power");
        
        votePowerSpent[msg.sender] += amount;
        proposals[proposal].voteCount += amount;
    }

    function getVotePower(address voter_) public view returns (uint256) {
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

    // Helper function to get total proposals count
    function getProposalsLength() external view returns (uint256) {
        return proposals.length;
    }
}