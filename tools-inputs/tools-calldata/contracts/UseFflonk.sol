// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;
import "./IVerifierRollup.sol";

contract UseFflonk{

    IVerifierRollup public verifierRollup;
    bool public test = false;

    function opCallVerifier(address contractAddress, bytes32[24] calldata proof, uint256 pubSignal) external {
        verifierRollup = IVerifierRollup(contractAddress);
        test = verifierRollup.verifyProof(proof, [pubSignal]);
    }
}
