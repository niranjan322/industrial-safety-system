let logs = [];

const RFIDLog = {
  create: async (data) => {
    const record = { ...data, timestamp: new Date(), _id: Date.now().toString() };
    logs.unshift(record);
    if (logs.length > 100) logs.pop();
    return record;
  },
  find: () => {
    return {
      sort: (opts) => {
        return {
          limit: (n) => logs.slice(0, n)
        };
      }
    };
  }
};

module.exports = RFIDLog;
