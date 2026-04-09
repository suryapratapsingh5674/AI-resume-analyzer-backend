import jwt from "jsonwebtoken";
import userModle from "../models/user.model.js";
import blacklistModel from "../models/blaklistToken.model.js";

const isUserSigned = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      message: "login first as user.",
    });
  }

  const isTokenValid = await blacklistModel.findOne({token:token});

  if(isTokenValid){
    return res.status(401).json({
        message: "Invalid token"
    })
  }

  let verify;
  try {
    verify = jwt.verify(token, process.env.JWTOKEN);
  } catch (error) {
    return res.status(401).json({
      message: "invalid or expired token.",
    });
  }

  if (!verify) {
    return res.status(401).json({
      message: "login first as user.",
    });
  }

  const user = await userModle.findOne({ email: verify.email });

  if (!user) {
    return res.status(401).json({
      message: "conn't find user.",
    });
  }

  req.user = user;

  next();
};

export default isUserSigned;
