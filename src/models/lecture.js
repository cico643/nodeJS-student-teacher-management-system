const mongoose = require("mongoose")

const lectureSchema = new mongoose.Schema({
    lectureName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
    },
    lectureInstructor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    lectureNo: {
        type: String,
        unique: true,
        required: true
    },
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    assignments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment'
    }]
}, {timestamps: true})

const Lecture = mongoose.model("Lecture", lectureSchema)

module.exports = Lecture