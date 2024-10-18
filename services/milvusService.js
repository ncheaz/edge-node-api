const { MilvusClient } = require('@zilliz/milvus2-sdk-node');
class MilvusService {
    constructor() {
        this.userConfig = null;
        this.client = null;
    }
    setUserConfig(config) {
        return (this.userConfig = config.reduce((acc, obj) => {
            acc[obj.option] = obj.value;
            return acc;
        }, {}));
    }
    initMilvusClient() {
        const milvus_address = this.userConfig.milvus_address;
        const milvus_token = this.userConfig.milvus_token;
        if (!milvus_address || !milvus_token) {
            throw new Error(
                'Milvus address or token is missing from the configuration.'
            );
        }
        this.client = new MilvusClient({
            address: milvus_address,
            token: milvus_token
        });
        console.log('Milvus client initialized with config.');
    }
    async insert(embeddingsAndMetadata) {
        if (!this.client) {
            throw new Error(
                'Milvus client is not initialized. Please call initMilvusClient first.'
            );
        }
        const collection_name = this.userConfig.vector_collection;
        if (!collection_name) {
            throw new Error('Collection name not found in configuration.');
        }
        const data = embeddingsAndMetadata.embeddings.map(
            (embedding, index) => ({
                langchain_vector: embedding,
                langchain_text: embeddingsAndMetadata.texts[index],
                ...embeddingsAndMetadata.metadatas[index]
            })
        );
        const insertResponse = await this.client.insert({
            collection_name,
            data
        });
        return insertResponse;
    }
}
module.exports = new MilvusService();
