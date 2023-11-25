import { asyncHandler } from '../utils/asyncHandler.js';
import { apiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;
    console.log('email: ', email);

    if (
        [fullname, email, username, password].some(
            (field) => field?.trim() === ''
        )
    ) {
        throw new apiError(400, 'All fields are required');
    }
    const existedUser = User.findOne({
        $or: [{ email }, { username }],
    });

    if (existedUser) {
        throw new apiError(409, 'Email or username already existed');
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new apiError(400, 'Avatar image are required');
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new apiError(500, 'Error occurred while uploading images');
    }

    const user = await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
    });
    const createdUser = await User.findById(user._id).select(
        '-password -refreshToken'
    );

    if (!createdUser) {
        throw new apiError(500, 'Error occurred while creating user');
    }
    return res
        .status(201)
        .json(new ApiResponse(200, createdUser, 'User created successfully'));
});

export { registerUser };
