const mongoose = require("mongoose");
const TrackSchema = new mongoose.Schema({
    images: {
        type: Array,
    },
    description: {
        type: String,
        required: true,
    },
    createdTime: {
        type: Date,
        default: Date.now,
    },
    updatedTime: {
        type: Date,
        default: Date.now,
    },  
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    coupleId: {
        type: String,
        required: true,
    },
});
const TrackMoudles = mongoose.model("track", TrackSchema, "tracks");
module.exports = TrackMoudles;