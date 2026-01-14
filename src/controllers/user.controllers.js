import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponses } from "../utils/apiResponse.js";
import jsonwebtoken from "jsonwebtoken"

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new apiError(
            500,
            "something went wrong while generating  accesstoken and refreshToken ",
            error
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
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

    const { email, userName, password, fullName } = req.body;
    console.log(`Email : ${email}`);

    // validation - user might be empty , email in right way

    if (
        [email, userName, password, fullName].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new apiError(400, "all field are required ");
    }

    // validating the email

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
        throw new apiError(400, "your email format is invalid");
    }

    // checking if the user already existed

    const existedUser = await User.findOne({
        $or: [{ userName }, { email }],
    });
    if (existedUser) {
        throw new apiError(
            409,
            "user with this email or username already existed "
        );
    }

    // file are there or not ? : avatar : required and coverimage

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new apiError(400, "avatar file is required");
    }
    // coverImage is option so no need to validate .....
    // uploading file to cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log(avatarLocalPath);
    console.log("Upload avatar result:", avatar);

    let coverImage;
    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }

    //  avatar checking

    if (!avatar) {
        throw new apiError(400, " avatar upload failed");
    }

    // create user object - create entries in db

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase(),
    });

    // remove password and refresh token

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    // checking is the user is created or not

    if (!createdUser) {
        throw new apiError(
            500,
            " something went wrong while registering the user "
        );
    }
    // return resposne

    return res
        .status(201)
        .json(new apiResponses(201, createdUser, "User created Successful "));
});

const loginUser = asyncHandler(async (req, res) => {
    /*

    request.body => request the data from the body 
    check userName, email 
    find the user based on either email, userName 
    check the password 
    access and refresh token and send to the user 
    send the cookies, secured cookies 
    send the response after cookies success , 
    */

    // request.body => request the data from the body

    const { email, userName, password } = req.body;
    console.log({email},{userName});

    // checking wether the email or username are entered or not checking if we did get that data or not  ?

    if (!(userName || email)) {
        throw new apiError(400, "userName or email is required ");
    }

    // finding the user based on the either email or userName
    const user = await User.findOne({
        $or: [{ email }, { userName }],
    });

    // user is there or not

    if (!user) {
        throw new apiError(404, "user didint exit ");
    }
    // checking the password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new apiError(401, "password is incorrect");
    }

    // accessand refresh Token

    const { accessToken, refreshToken } =
        await generateAccessTokenAndRefreshToken(user._id);

    // send accesstoken and refresh token in the cookie , send the secure cookies

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const option = {
        httpOnly: true,
        secured: true,
    };

    // returning the responses

    return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(
            new apiResponses(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },

                "User loggedIn Successfully "
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },

        {
            new: true,
        }
    );
    const option = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(new apiResponses(200, {}, "user Loggedout successfully "));
});

const refreshAccessToken = asyncHandler(async(req,res)=>{

    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if(!incomingToken){
            throw new apiError(401,"unauthorized request ")
    
        }
        const decodedAccessToken = jsonwebtoken.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
    
        )
    
        const user = await User.findById(decodedAccessToken?._id)
        if(!user){
            throw new error(401, "invalid refresh token")
    
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apiError(401, "refresh token is expired or used ")
            
        }
    
        const option = {
            httpOnly:true,
            secure: true, 
        }
        const {accessToken,newRefreshToken}=await generateAccessTokenAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("access",accessToken,option)
        .cookie("refresh",newRefreshToken,option)
        .json(
            new apiResponses(200,
                {accessToken, refreshToken:newRefreshToken},
                "access token refreshed successfully "
            )
        )
    } catch (error) {
        throw new apiError(401,"invalid refresh token ",error)
        
    }


})




export { registerUser, loginUser, logoutUser,refreshAccessToken };
