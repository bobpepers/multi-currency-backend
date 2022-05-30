// create a completely new and unique pair of keys
import StellarSdk from 'stellar-sdk';

// see more about KeyPair objects: https://stellar.github.io/js-stellar-sdk/Keypair.html
const pair = StellarSdk.Keypair.random();

const secretPair = pair.secret();
const publicPair = pair.publicKey();

console.log('secret pair:');
console.log(secretPair);
console.log('---------');
console.log('public pair:');
console.log(publicPair);
