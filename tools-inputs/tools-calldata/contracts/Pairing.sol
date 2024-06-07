// Copyright (c) Immutable Pty Ltd 2018 - 2024
// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

/**
 * Use the BLS EC Pairing precompile to add lots of complexity.
 *
 * Much of the code in this file is derived from here:
 * https://github.com/kfichter/solidity-bls/blob/master/contracts/BLS.sol
 */
contract Pairing {

    bool public result;

    struct E1Point {
        uint256 x;
        uint256 y;
    }

    // Note that the ordering of the elements in each array needs to be the reverse of what you would
    // normally have, to match the ordering expected by the precompile.
    struct E2Point {
        uint256[2] x;
        uint256[2] y;
    }

    function setResultFalse() public {
        result = false;
    }

    function checkBigBadEcPairingExpectPass(
        uint256 _howBig
    ) external {
        result = false;
        E1Point memory g1 = G1();
        E1Point memory invertedG1 = negate(G1());
        E2Point memory g2 = G2();

        E1Point[] memory e1points = new E1Point[](_howBig);
        E2Point[] memory e2points = new E2Point[](_howBig);
        for (uint256 i = 0; i < _howBig; i++) {
            if (i & 1 != 0) {
                e1points[i] = invertedG1;
            }
            else {
                e1points[i] = g1;
            }
            e2points[i] = g2;
        }
        pairing(e1points, e2points);
        result = true;
    }

    /**
     * @return The generator of E1.
     */
    function G1() private pure returns (E1Point memory) {
        return E1Point(1, 2);
    }

    /**
     * @return The generator of E2.
     */
    function G2() private pure returns (E2Point memory) {
        return
            E2Point({
                x: [
                    11559732032986387107991004021392285783925812861821192530917403151452391805634,
                    10857046999023057135944570762232829481370756359578518086990519993285655852781
                ],
                y: [
                    4082367875863433681332203403145435568316851327593401208105741076214120093531,
                    8495653923123431417604973247489272438418190587263600148770280649306958101930
                ]
            });
    }

    /**
     * Negate a point: Assuming the point isn't at infinity, the negatation is same x value with -y.
     *
     * @dev Negates a point in E1.
     * @param _point Point to negate.
     * @return The negated point.
     */
    function negate(E1Point memory _point)
        private
        pure
        returns (E1Point memory)
    {
        // Field Modulus.
        uint256 q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        if (isAtInfinity(_point)) {
            return E1Point(0, 0);
        }
        return E1Point(_point.x, q - (_point.y % q));
    }

    /**
     * Computes the pairing check e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
     *
     * @param _e1points List of points in E1.
     * @param _e2points List of points in E2.
     * @return True if pairing check succeeds.
     */
    function pairing(E1Point[] memory _e1points, E2Point[] memory _e2points)
        private
        view
        returns (bool)
    {
        require(_e1points.length == _e2points.length, "Point count mismatch.");

        uint256 elements = _e1points.length;
        uint256 inputSize = elements * 6;
        uint256[] memory input = new uint256[](inputSize);

        for (uint256 i = 0; i < elements; i++) {
            input[i * 6 + 0] = _e1points[i].x;
            input[i * 6 + 1] = _e1points[i].y;
            input[i * 6 + 2] = _e2points[i].x[0];
            input[i * 6 + 3] = _e2points[i].x[1];
            input[i * 6 + 4] = _e2points[i].y[0];
            input[i * 6 + 5] = _e2points[i].y[1];
        }

        uint256[1] memory out;
        bool success;

        assembly {
            // Start at memory offset 0x20 rather than 0 as input is a variable length array.
            // Location 0 is the length field.
            success := staticcall(
                sub(gas(), 2000),
                8,
                add(input, 0x20),
                mul(inputSize, 0x20),
                out,
                0x20
            )
        }
        // The pairing operation will fail if the input data isn't the correct size (this won't happen
        // given the code above), or if one of the points isn't on the curve.
        require(success, "Pairing operation failed.");

        return out[0] != 0;
    }

    /**
     * Check to see if the point is the point at infinity.
     *
     * @param _point a point on E1.
     * @return true if the point is the point at infinity.
     */
    function isAtInfinity(E1Point memory _point) private pure returns (bool) {
        return (_point.x == 0 && _point.y == 0);
    }
}