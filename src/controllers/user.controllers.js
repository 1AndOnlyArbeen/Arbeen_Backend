import {asyncHandler} from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import  {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiResponses } from "../utils/apiResponse.js"


const registerUser = asyncHandler(async(req,res)=>{


    /*get user details form frontend 
    validation - user might be empty , email in right way 
    check if user already exists usrename, email 
    file are there or not ? : avatar : required and coverimage 
    upload then to cloudinary , avatar check :
    create user object - create entries in db
    remove password and refresh token  
    check if the user created or not || response i get or nto ?
    return res
    */

    const {email, userName, password }= req.body
    console.log(`Email : ${email}`);

    // validation - user might be empty , email in right way 


    if ([email,userName,password].some((field)=>
    field?.trim()==="")) {
        throw new apiError(400, "all field are required ")
        
    }

    // validating the email 

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
        throw new apiError(400, "your email format is invalid")        
    }

    // checking if the user already existed 

    const existedUser = await User.findOne({
        $or: [{userName},{email}]
    })
    if (existedUser) {
        throw new apiError(409,"user with this email or username already existed ")
        
    }


    // file are there or not ? : avatar : required and coverimage 
    
    const avatarLocalPath = await req.files?.avatar[0]?.path
    console.log(avatarLocalPath);
    const coverImageLocalPath = await req.files?.coverImage[0]?.path
    console.log(coverImageLocalPath);

    if (!avatarLocalPath) {
        throw new apiError(400, "avatar file is required")
        
    }
    // coverImage is option so no need to validate .....    
    // uploading file to cloudinary 

    const avatarUrlUploading = await uploadOnCloudinary(avatarLocalPath)
    const coverImageUrlUploading = await uploadOnCloudinary(coverImageLocalPath)

    //  avatar checking

    if (!avatarUrlUploading) {
        throw new apiError,(400, " avatar is required ")
    }

    // create user object - create entries in db

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
        
    })
    
    // remove password and refresh token  

    const createdUser = await user.findById (user._id).select(
        "-password -refreshToken"
    )
    // checking is the user is created or not 

    if (!createdUser) {
        throw new apiError(500, " something went wrong while registering the user ")
        
    }
    // return resposne 

    return res.status(201).json(
        new apiResponses(201, createdUser,"User created is successful ")
    )
  

})
export {registerUser}