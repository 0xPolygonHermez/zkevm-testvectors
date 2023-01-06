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
                version: '0.8.7',
            },
            {
                version: '0.6.6',
            },
            {
                version: '0.8.9',
            },
        ],
    },
};
