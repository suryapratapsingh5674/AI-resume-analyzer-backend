import {
  generateInterviewReport,
  generateResumePdf,
} from "../services/ai.service.js";
import { PDFParse } from "pdf-parse";
import interviewModel from "../models/interviewReport.model.js";
import mongoose from "mongoose";

const aiController = async (req, res) => {
  const user = req.user;
  const { selfDescription, jobDescription } = req.body;
  let resume;
  try {
    const pdfParser = new PDFParse({ data: req.file.buffer });
    const textResult = await pdfParser.getText();
    resume = textResult.text;
    await pdfParser.destroy();
  } catch (error) {
    return res.status(400).json({
      message: "Failed to parse PDF file: " + error.message,
    });
  }

  if (!resume || !selfDescription || !jobDescription) {
    return res.status(401).json({
      message: "resume, selfDescription and jobDescription is required.",
    });
  }

  const response = await generateInterviewReport({
    resume,
    selfDescription,
    jobDescription,
  });

  if (!response) {
    return res.status(401).json({
      message: "cann't generate interview report.",
    });
  }

  const interviewReport = await interviewModel.create({
    jobDescription: jobDescription,
    selfDescription: selfDescription,
    resume: resume,
    matchScore: response.matchScore,
    technicalQuestions: response.technicalQuestion,
    behavioralQuations: response.behavioralQuestion,
    skillGaps: response.skillGap,
    preparetionPlan: response.preparetionPlan,
    user: user._id,
  });

  if (!interviewReport) {
    return res.status(401).json({
      message: "interviewReport not saved",
    });
  }

  return res.status(200).json({
    interviewReport,
  });
};

const getInterviewById = async (req, res) => {
  const { interviewId } = req.params;

  if (!mongoose.isValidObjectId(interviewId)) {
    return res.status(400).json({
      message: "invalid interview id.",
    });
  }

  try {
    const interviewReport = await interviewModel
      .findOne({
        _id: interviewId,
        user: req.user._id,
      })
      .select(
        "-resume -selfDescription -jobDescription -__v -createdAt -updatedAt -user",
      );
    return res.status(200).json({
      interviewReport,
    });
  } catch (e) {
    return res.status(401).json({
      message: "not able to find interview report.",
      e,
    });
  }
};

const getAllInterview = async (req, res) => {
  const allInterview = await interviewModel
    .find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .select("-resume -selfDescription -__v -createdAt -updatedAt -user");

  if (!allInterview) {
    return res.status(401).json({ message: "not able to fetch interviews" });
  }

  return res.status(200).json({
    allInterview,
  });
};

const generateresumePdf = async (req, res) => {
  const { interviewId } = req.params;

  if (!mongoose.isValidObjectId(interviewId)) {
    return res.status(400).json({
      message: "invalid interview id.",
    });
  }

  try {
    const interview = await interviewModel.findOne({
      _id: interviewId,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({
        message: "interview not found.",
      });
    }

    const { resume, selfDescription, jobDescription } = interview;

    const pdfBuffer = await generateResumePdf({
      resume,
      selfDescription,
      jobDescription,
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=resume_${interviewId}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating resume PDF:", error);
    return res.status(500).json({
      message: "Failed to generate resume PDF.",
    });
  }
};

export { aiController, getInterviewById, getAllInterview, generateresumePdf };
