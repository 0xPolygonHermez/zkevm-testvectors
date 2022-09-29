require('@nomiclabs/hardhat-waffle');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: {
        compilers: [
            {
                version: '0.5.16',
            },
            {
                version: '0.6.6',
            },
            {
                version: '0.7.6',
            },
        ],
        overrides: {
            'contracts/Math.sol': {
                version: '0.5.16',
                settings: {},
            },
        },
    },
};
