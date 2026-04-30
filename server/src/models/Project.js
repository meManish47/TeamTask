const { Schema, model } = require('mongoose');

const transform = (_, obj) => { obj.id = obj._id; delete obj._id; delete obj.__v; return obj; };

const projectSchema = new Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  color:       { type: String, default: '#7c5cf6' },
  ownerId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, toJSON: { transform } });

module.exports = model('Project', projectSchema);
