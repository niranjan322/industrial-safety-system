const bcrypt = require('bcryptjs');

let users = [];

const User = {
  findOne: async (query) => {
    return users.find(u => u.username === query.username);
  },
  create: async (data) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    const user = { 
      _id: Date.now().toString(), 
      username: data.username, 
      password: hashedPassword,
      matchPassword: async function(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
      }
    };
    users.push(user);
    return user;
  },
  countDocuments: async () => users.length
};

// Auto-inject the fixed user so they can login immediately
User.create({ username: 'NIRANJAN', password: 'Maker@2026' });

module.exports = User;
