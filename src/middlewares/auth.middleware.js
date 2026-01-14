import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jsonwebtoken from "jsonwebtoken";
import {User} from "../models/user.model.js"


export const verifyJWT = asyncHandler (async(req,res,next)=>{

   const token = req.cookies?.accessToken ||
   req.header("Authorization")?.replace("Bearer ","")

   if (!token) {
    throw new apiError(401, "unauthoried Request ")
    
   }

//    decoding the token 

   const decodedToken = jsonwebtoken.verify(token, process.env.ACCESS_TOKEN_SECRET)
   const user = await User.findById(decodedToken?._id).select(
    "-password,-refreshToken" 
   )
   if(!user){

    throw new apiError(401, "invalid access token ")
   }

   req.user = user
   next()



})