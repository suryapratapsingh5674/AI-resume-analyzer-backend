import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import blacklistModel from "../models/blaklistToken.model.js";

const registerUser = async (req, res) => {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    return res.status(401).json({
      message:
        "username, email and password is required for register new user.",
    });
  }

  const isUserAlredyExist = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (isUserAlredyExist) {
    return res.status(401).json("user alredy exist login to access account.");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  try {
    const user = await userModel.create({
      username,
      email,
      password: hashPassword,
    });

    const token = await jwt.sign(
      {
        username: username,
        email: email,
        id: user._id,
      },
      process.env.JWTOKEN,
      { expiresIn: "7d" },
    );

    res.cookie("token", token);

    return res.status(200).json({
      mesage: " new user created successfully, ",
      user,
    });
  } catch (e) {
    return res.status(401).json({
      message: "error while regiter new user, ",
      e,
    });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      message: "email and password are required.",
    });
  }

  const user = await userModel.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({
      message: "user not found, plese register first.",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      message: "invalid password.",
    });
  }

  const token = await jwt.sign({ email }, process.env.JWTOKEN, {
    expiresIn: "7d",
  });

  res.cookie("token", token);

  return res.status(200).json({
    message: "logined in successfully.",
    user
  });
};

const logout = async (req, res) => {
  const token = req.cookies?.token;

  if (token) {
    await blacklistModel.create({ token });
  }

  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  return res.status(200).json({
    message: "logged out successfully",
  });
};

const getme = async (req, res)=>{
  return res.status(200).json({
      user:req.user
  })
}

export { registerUser, loginUser, logout, getme };
