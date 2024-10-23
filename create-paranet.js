const DKG = require('dkg.js');
require('dotenv').config();
const {
    PARANET_NODES_ACCESS_POLICY,
    PARANET_MINERS_ACCESS_POLICY
} = require('dkg.js/constants.js');

let DkgClient = new DKG({
    environment: process.env.DKG_ENV,
    endpoint: process.env.RUNTIME_NODE_ENDPOINT,
    port: '8900',
    blockchain: {
        name: 'base:84532',
        publicKey: process.env.PUB_KEY,
        privateKey: process.env.PRIV_KEY
    },
    maxNumberOfRetries: 30,
    frequency: 2,
    contentType: 'all'
});

let KAContent = {
    public: {
        '@context': ['https://schema.org'],
        '@id': 'urn:id:paranet:5',
        paranetName: 'Testnet Paranet 5',
        paranetDescription: 'Testnet Paranet 5'
    }
};

// Operational wallet public key of the node
const NODE1_PUBLIC_KEY = '';

async function createParanet() {
    let KA = await DkgClient.asset.create(KAContent, {
        epochsNum: 2
    });
    if (KA.operation.publish.status === 'COMPLETED') {
        let paranetKA = await DkgClient.paranet.create(KA.UAL, {
            paranetName: KAContent.public.paranetName,
            paranetDescription: KAContent.public.paranetDescription,
            paranetNodesAccessPolicy: PARANET_NODES_ACCESS_POLICY.CURATED,
            paranetMinersAccessPolicy: PARANET_MINERS_ACCESS_POLICY.OPEN
        });

        const node1IdentityId = await DkgClient.node.getIdentityId(
            NODE1_PUBLIC_KEY
        );

        // Adding nodes to a curated paranet
        const identityIdsToAdd = [node1IdentityId];
        await DkgClient.paranet.addCuratedNodes(
            paranetKA.paranetUAL,
            identityIdsToAdd
        );

        console.log(paranetKA.paranetUAL, 'paranetUAL');
    }
}

createParanet();
