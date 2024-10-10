const DKG = require('dkg.js');

let DkgClient = new DKG({
    environment: "testnet",
    endpoint: "",
    port: "8900",
    blockchain: {
        name: "base:84532",
        publicKey: "",
        privateKey: ""
    },
    maxNumberOfRetries: 30,
    frequency: 2,
    contentType: 'all',
});

let KAContent = {
    public: {
        '@context': ['https://schema.org'],
        '@id': 'urn:id:paranet:1',
        paranetName: 'MyParanet',
        paranetDescription: 'Local development',
    },
};

async function createParanet() {
    let KA = await DkgClient.asset.create(KAContent, {
        epochsNum: 2,
    })
    if(KA.operation.publish.status === 'COMPLETED') {
        let paranetKA = await DkgClient.paranet.create(KA.UAL, {
            paranetName: KAContent.public.paranetName,
            paranetDescription: KAContent.public.paranetDescription
        });
        console.log(paranetKA.paranetUAL, 'paranetUAL');
    }
}

createParanet()

