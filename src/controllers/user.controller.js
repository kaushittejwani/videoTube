
import { asynchandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { uploadFileOnCloudinary } from "../utils/clouldinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from 'jsonwebtoken'
import { validateLocaleAndSetLanguage } from "typescript";
import { subscribe } from "diagnostics_channel";
import mongoose from "mongoose";
const register=  asynchandler(async(req,res)=>{
    console.log("hy i am in register function")
  const {fullName,password,email,userName}=req.body
  console.log(fullName)
  if([fullName,email,userName,password].some((field)=>
    field?.trim()==""))
  {
    throw new ApiError(400,"All fields are required")
  }
const existUser= await User.findOne({$or:[{email:email},{userName:userName}]})

 if(existUser){
     throw new ApiError(500,"user with email or full name are alrady exists")
 }
 const avatarpath=await req.files?.avatar[0].path;
 const coverImagepath= await req.files?.coverImage[0].path;
 if(!avatarpath){
throw new ApiError(400,"avatar upload is required")
 }
 console.log(avatarpath)

const avatarUpload= await uploadFileOnCloudinary(avatarpath);
const coverImageUpload=await uploadFileOnCloudinary(coverImagepath)

if(!avatarUpload||!coverImageUpload){
    throw new ApiError(500,"avatar or coverImage upload failed")
}

const registerUser=await User.create({
    fullName,
    avatar:avatarUpload.url,
    coverImage:coverImageUpload?.url||"",
    userName:userName.toLowerCase(),
    email,
    password
});
const userCreated=await User.findById({_id:registerUser._id}).select("-password -refreshToken")
if(!userCreated){
    throw new ApiError(500,"something went wrong while registering the user")
}
 return res.status(201).json(
    new ApiResponse(200,userCreated,"user registered successfully")
 )

})

const login =asynchandler(async(req,res)=>{
  //steps to make login
  //take email and password from body
  //check the email in the db if yes
  // compre the bcypt password with orginal one after decryption
  //generate access token and refresh token
  // save refresh token in db
  //send login successfully  with access token and refresh token in response

  const {userName,email,password}=req.body;
  if(!(userName||email)){
    throw new ApiError(400,"email or userName is required")
  }
 const user= User.findOne({$or:[{email},{userName}]})
 if(!user){
  throw new ApiError(404,"user not found")
 }
 const isPasswordCorrect=await user.isPasswordCorrect(password)
 if(!isPasswordCorrect){
  throw new ApiError(400,"password was incorrect")
 }

 //generate token
 const AccessToken=await user.generateAccessToken(user);
 const RefreshToken=await user.generateRefreshToken(user);

 user.refresToken=RefreshToken;
 user.save({validateBeforeSave:false});

 const loggedinUser=await user.findById({_id:user._id}).select("-password -refreshToken")

 //send cookkies
 const options={
  httpOnly:true,
  secure:true
 }

 return res.status(200)
 .cookie("accessToken",AccessToken,options)
 .cookie("refreshToken",RefreshToken,options)
 .json(
  new ApiResponse(200,{user:loggedinUser,RefreshToken, AccessToken},"user logged in successfully")
 )

})


const logout=asynchandler(async(req,res)=>{
  //logout user
  //first take the user id from user._id 
  //update the user object set refresh token =undefined from db
  // use options 
  //clear cookies 
  //done

  await User.findByIdAndUpdate(req.user?._id,{
    $set:{refreshToken:undefined}
  })

  const options={
    httpOnly:true,
    secure:true
  }

  res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(
    new ApiResponse(200,{},"user loged out successfully")
  )
})

const refreshToken=asynchandler(async(req,res)=>{
  //get accesstoken using refresh token
//step 1 - get refresh token from  req.cookies.refresToken
// step 2 once get it then decode it with jwt sign method
//step 3 get user id from payload and then search for user
//step 4 when user found compare the refresh token with db refresh token
//step 5 if both are sames generate access token and refresh token again and save new redfresh token in db
//step 6 save access token and refresh token cookies
//and return the user detail and remove passsword and refresh token from userr object
const refresToken=req.cookies.refreshToken;
if(!refresToken){
  throw new ApiError(404,"refresh token not found")
}
const decodeToken=jwt.verify(refresToken,process.env.REFRESH_TOKEN_SECRET)
if(!decodeToken){
  throw new ApiError(401,"Invalid token")
}
const user=User.findById(decodeToken._id)
if(!user){
  throw new ApiError(404,"user not found")
}
if(refresToken!==user.refreshToken){
 throw new ApiError(400,"Invalid refresh token")

}
//generate token
 const AccessToken=await user.generateAccessToken(user);
 const RefreshToken=await user.generateRefreshToken(user);

 user.refreshToken=RefreshToken;
 user.save({validateBeforeSave:true})

 const options={
  httpOnly:true,
  secure:true
 }

 res.status(200).cookie("accessToken",AccessToken,options).cookie("refreshToken",RefreshToken,options).json(new ApiResponse(200,{accessToken:AccessToken},"newAccesstoken created successfully"))



})

const changePassword=asynchandler(async(req,res)=>{
  //first take new password and  old password from the body
  // then get user details with user id which you get from auth middlewaree
  //then check the old password if its correct id it 
  //then bcrypt the password 
  //then save the password in db and return response 
  const {oldPassword,password}=req.body;
  const user= User.findById(req.user?._id)
  if(!user){
    throw new ApiError(404,"user not found")
  }
  const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);
  if(!isPasswordCorrect){
    throw new ApiError(400,"password was incorrect")
  }
  
  user.password=password
  user.save({validateBeforeSave:false})

  return res.status(200).json(new ApiResponse(200,{},"Password changed successfully"))


})

const getCurrntUser=(asynchandler(async(req,res)=>{
  return res.status(200).json(new ApiResponse(200,{user:req.user},"user fetched successfully"))
}))

 const updateDetails=asynchandler(async(req,res)=>{
  const {fullName,email}=req.body
  if(!(fullName||email))
  {
  throw new ApiError(400,"All fields are required")
}
const user=User.findByIdAndUpdate(req.user?._id,{
  $set:{
    fullName,
    email 
  },
},{
    new:true
  }
).select("-password")

return res.status(200).json(
  new ApiResponse(200,user,"user updated successufully")
)
 })

 const updateAvatar=asynchandler(async(req,res)=>{
  //first upload a new image to the cloudniary with name avatr
  // the update the avatar url and save in db 
  //send the response that avatar updated successfully

  const filepath=req.file?.path;
  if(!filepath){
    throw new ApiError(400,"path not found")
  }
  const avatar=await uploadFileOnCloudinary(filepath)
  if(!avatar){
    throw new ApiError(500,"upload failes")
  }
  const user=User.findById(req.user?._id).select("-pasword")
  if(!user){
    throw new ApiError(404,"user not found")
  }
  user.avatar=avatar.url;
  user.save({validateBeforeSave:false})

  res.status(200).json(new ApiResponse(200,{},"avatar updated successfully"))
 })

 const updatecoverImage=asynchandler(async(req,res)=>{
  //first upload a new image to the cloudniary with name avatr
  // the update the avatar url and save in db 
  //send the response that avatar updated successfully

  const filepath=req.file?.path;
  if(!filepath){
    throw new ApiError(400,"path not found")
  }
  const coverImage=await uploadFileOnCloudinary(filepath)
  if(!coverImage){
    throw new ApiError(500,"upload failes")
  }
  const user=User.findById(req.user?._id).select("-password")
  if(!user){
    throw new ApiError(404,"user not found")
  }
  user.coverImage=coverImage.url;
  user.save({validateBeforeSave:false})

  res.status(200).json(new ApiResponse(200,{},"coverImage updated successfully"))
 })

 const  getUserChannelProfile=asynchandler(async(req,res)=>{
  const {username}=req.params;
  if(!username?.trim()){
    throw new ApiError(400,"userName is missing")
  }
  const channel =User.aggregate([
    {$match:username?.toLowerCase()},
    {$lookup:{
      from:"subscriptions",
      localField:"_id",
      foreignField:"channel",
      as:"subscribers"
    }},{
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribeTo"
      }
    },
    {$addFields:{
       subscribersCount:{$size:"$subscribers"},
       subscribedToCount:{$size:"$subscribeTo"},
       isSubscribed:{
        $cond:{
          if:{$in:[req.user?._id,"$subscribers.subscriber"]},
          then:true,
          else:false
        }
       }
    }},
    {
      $project:{
        fullName:1,
        username:1,
        email:1,
        avatar:1,
        coverImage:1,
        isSubscribed:1,
        subscribersCount:1,
        subscribedToCount:1
      }
    }
  ])
  if(!channel?.length){
    throw new ApiError(404,"channel does not exist")
  }
  console.log(channel)
  return res.status(200).json(new ApiResponse(200,channel[0],"user channel profile fetched successfully"))
 })

const getWatchHistory=asynchandler(async(req,res)=>{
  ////get user
  const user=await User.aggregate([
    {
      $match:new mongoose.Types.ObjectId(req.user._id)

    },
    {
      $lookup:{
        from:"Video",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
           $lookup:{
            from:"Users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[
            {
                 $project:{
                  fullName:1,
                  userName:1,
                  avatar:1,
                  email:1
                 
              },
              
                $addFields:{
                  owner:{
                    $first:"$owner"
                  }
                }
              
           }
        ]
            
           }
          }
        ]
        
      }
    },
    
  ])
  return res.status(200).json(new ApiResponse(200,{watchHistory:user[0].watchHistory},"watch history fetched successfully"))
})

export {register,login,logout,refreshToken,changePassword,getCurrntUser,updateDetails,updateAvatar,updatecoverImage,getUserChannelProfile,getWatchHistory}
