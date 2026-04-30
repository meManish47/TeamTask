const { Schema, model } = require('mongoose');

const transform = (_, obj) => { obj.id = obj._id; delete obj._id; delete obj.__v; return obj; };

const projectMemberSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  userId:    { type: Schema.Types.ObjectId, ref: 'User',    required: true },
  role:      { type: String, enum: ['ADMIN', 'MEMBER'], default: 'MEMBER' },
  joinedAt:  { type: Date, default: Date.now },
}, { toJSON: { transform } });

projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

module.exports = model('ProjectMember', projectMemberSchema);
