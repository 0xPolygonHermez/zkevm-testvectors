# Create custom tests to public or internal

````
cd tools/testnet
cp .env.example .env
````
Fill .env file
````
PRIVATE_KEY=""
ENDPOINT=""
````

Check `txs.json` to see the tested transactions. More can be added if necessary
To run:
````
node tx-sender.test.js
````