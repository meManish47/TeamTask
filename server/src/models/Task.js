const { Schema, model } = require('mongoose');

const transform = (_, obj) => { obj.id = obj._id; delete obj._id; delete obj.__v; return obj; };

const taskSchema = new Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status:      { type: String, enum: ['TODO', 'IN_PROGRESS', 'DONE'], default: 'TODO' },
  priority:    { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  dueDate:     { type: Date },
  projectId:   { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  assigneeId:  { type: Schema.Types.ObjectId, ref: 'User', default: null },
  createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, toJSON: { transform } });

module.exports = model('Task', taskSchema);
