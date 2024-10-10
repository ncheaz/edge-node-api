const queues = {};

setInterval(() => {
    const memoryUsage = process.memoryUsage();
    console.log(`Memory Usage: 
    RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB
    Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB
    Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
    External: ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`);
}, 10000); // Check memory every 10 seconds

setInterval(async () => {
    const jobCountsByWallet = {}; // Store metrics per wallet
    const jobs = await Promise.all(
        Object.keys(queues).map((wallet) => queues[wallet].getJobs(['waiting', 'active']))
    );

    for (const job of jobs.flat()) {
        const {wallet} = job.data;
        const state = await job.getState();

        if (!jobCountsByWallet[wallet]) jobCountsByWallet[wallet] = {waiting: 0, active: 0};
        if (state === 'waiting') jobCountsByWallet[wallet].waiting += 1;
        if (state === 'active') jobCountsByWallet[wallet].active += 1;
    }
    console.log('Job counts by wallet:', jobCountsByWallet);
}, 10000);
