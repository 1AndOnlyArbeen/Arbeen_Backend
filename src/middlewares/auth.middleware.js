import { apiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import jsonwebtoken from "jsonwebtoken";
import {User} from "../models/user.model"



export const verifyJWT = asyncHandler (async(req,res,next)=>{

   const token = req.cookies?.accessToken ||
   req.header("Authorization")?.replcae("Bearer ","")

   if (!token) {
    throw new apiError(401, "unauthoried Request ")
    
   }

//    decoding the token 

   const decodedToken = jsonwebtoken.verify(token, process.env.ACCESS_TOKEN_SECRET)
   const user = await User.findByIdId(decodedToken?._id).select(
    "-password,-refreshToken" 
   )
   if(!user){

    throw new apiError(401, "invalid access token ")
   }

   req.user = user
   next()



})