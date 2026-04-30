const { Schema, model } = require('mongoose');

const transform = (_, obj) => { obj.id = obj._id; delete obj._id; delete obj.__v; return obj; };

const commentSchema = new Schema({
  content:  { type: String, required: true, trim: true },
  taskId:   { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, toJSON: { transform } });

module.exports = model('Comment', commentSchema);
