const { Schema, model } = require('mongoose');

const transform = (_, obj) => { obj.id = obj._id; delete obj._id; delete obj.__v; return obj; };

const userSchema = new Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true, toJSON: { transform } });

module.exports = model('User', userSchema);
