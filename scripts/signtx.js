const ethTx = require('ethereumjs-tx');

// const txParams = {
//   nonce: '0x6', // Replace by nonce for your account on geth node
//   gasPrice: '0x09184e72a000', 
//   gasLimit: '0x30000',
//   to: '0xfa3caabc8eefec2b5e2895e5afbf79379e7268a7', 
//   value: '0x00'
// };

const txParams = {
    "nonce":"0x5b",
    "gasPrice":"0x098bca5a00",
    "gasLimit":"0x878a",
    "to":"0x5605cfEF66fd365b07E2675924D5A6849cc5A36c",
    "value":"0x00",
    "data":"0x6e50eb3f0000000000000000000000000000000000000000000000000000000149677d1c",
    "chainId":3
};
// Transaction is created
const tx = new ethTx(txParams);
const privKey = Buffer.from('2be8064847d75911279176eff082f699f8a048a4f79eca7b1af0564a3eae4919', 'hex');
// Transaction is signed
tx.sign(privKey);
const serializedTx = tx.serialize();
const rawTx = '0x' + serializedTx.toString('hex');
console.log(rawTx)

