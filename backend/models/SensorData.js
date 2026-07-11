let dataStore = [];

const SensorData = {
  create: async (data) => {
    const record = { ...data, timestamp: new Date(), _id: Date.now().toString() };
    dataStore.unshift(record);
    if (dataStore.length > 100) dataStore.pop(); // Keep only last 100
    return record;
  },
  findOne: () => {
    return {
      sort: (opts) => {
        return dataStore[0] || null;
      }
    };
  },
  find: () => {
    return {
      sort: (opts) => {
        return {
          limit: (n) => dataStore.slice(0, n)
        };
      }
    };
  }
};

module.exports = SensorData;
