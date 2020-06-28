const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  
    name: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    submissions: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        file: {
          type: String
        },
        mark: {
          type: String,
          default: '-1'
        }
      }],
    lecture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lecture'
    }
});



const Assignment = mongoose.model('Assignment', AssignmentSchema)
module.exports = Assignment