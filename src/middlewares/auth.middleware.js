import { asynchandler } from "../utils/asynchandler.js";
import jwt from 'jsonwebtoken'
import { User } from "../models/user.model.js";
import { request, response } from "express";
import { ApiError } from "../utils/apiError.js";

//verify jwt 
//step 1 get the tokn from req.header("authorization") or req.cookies.accesstoken
//step 2 replace the Bearer and with space and the remainig is token
// step 3 compare call jwt.verify method and pass token and secret in that and save in the variable
//step 4 if success then get the id in payload and search from the user
// step 5 if not then give the apierror that invalid token
// step 6 if user exist save user into req obj if not ,give error
// step 6 then call next () function

const verifyJwt=asynchandler(async(request,_,next)=>{
    const token =request.header("Authorization")|| request.cookies?.accessToken?.replace("Bearer","");
    if(!token){
        throw new ApiError(401,"Unauthorized request")
    }
    const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    if(!decodedToken){
        throw new ApiError(400,"Invalid token")
    }
    const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
    if(!user){
        throw new ApiError(404,"User not found invalid token")
    }
    request.user=user
    next()
})

export {verifyJwt}