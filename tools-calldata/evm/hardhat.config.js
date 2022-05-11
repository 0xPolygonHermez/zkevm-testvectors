require("@nomiclabs/hardhat-waffle");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.9",
      },
      {
        version: "0.6.11",
      },
      {
        version: "0.5.16",
      },
      {
        version: "0.8.7",
      }
    ]
  },
};
