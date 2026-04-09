import mongoose from "mongoose"

const technicalQuestionsSchema = new mongoose.Schema({
    question:{
        type: String,
        required:[true, "question is required"]
    },
    intention:{
        type:String,
        required:[true, "intention is required"]
    },
    answer:{
        type:String,
        required:[true, "answer is required"]
    }
}, {_id:false})

const behavioralQuationsSchema = new mongoose.Schema({
    question:{
        type: String,
        required:[true, "question is required"]
    },
    intention:{
        type:String,
        required:[true, "intention is required"]
    },
    answer:{
        type:String,
        required:[true, "answer is required"]
    }
}, {
    _id: false
})

const skillGapsSchema = new mongoose.Schema({
    skill:{
        type: String,
        required:[true, "skill is required"]
    },
    severity:{
        type:String,
        enum:["low","medium","high"],
        required:[true, "severity is required"]
    },
},{
    _id:false
})

const preparetionPlanSchema = new mongoose.Schema({
    day:{
        type:Number,
        required:[true, "day is required."]
    },
    focus:{
        type:String,
        required:[true, "focus is required"]
    },
    tasks:[{
        type:String,
        required:[true, "tasks is required"]
    }]
}, {
    _id:false
})

const interviewReportSchema = new mongoose.Schema({
    jobDescription: {
        type:String,
        required: [true, "jb description is required"]
    },
    resume: {
        type: String,
    },
    selfDescription:{
        type: String,
    },
    matchScore:{
        type:Number,
        min:0,
        max:100
    },
    technicalQuestions:[technicalQuestionsSchema],
    behavioralQuations:[behavioralQuationsSchema],
    skillGaps:[skillGapsSchema],
    preparetionPlan:[preparetionPlanSchema],
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    }
}, {
    timestamps: true
})

const interviewModel = mongoose.model("interview", interviewReportSchema);

export default interviewModel;