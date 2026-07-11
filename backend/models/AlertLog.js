let alerts = [];

const AlertLog = {
  create: async (data) => {
    const record = { ...data, timestamp: new Date(), _id: Date.now().toString() };
    alerts.unshift(record);
    if (alerts.length > 100) alerts.pop();
    return record;
  },
  find: () => {
    return {
      sort: (opts) => {
        return {
          limit: (n) => alerts.slice(0, n)
        };
      }
    };
  }
};

module.exports = AlertLog;
