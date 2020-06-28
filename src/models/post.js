const mongoose = require("mongoose")

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    lecture: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Lecture'
    }
}, {timestamps: true})

const Post = mongoose.model("Post", postSchema)

module.exports = Post